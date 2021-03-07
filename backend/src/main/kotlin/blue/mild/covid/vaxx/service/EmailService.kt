package blue.mild.covid.vaxx.service

import blue.mild.covid.vaxx.dao.Patient
import blue.mild.covid.vaxx.dto.MailJetConfigurationDto
import blue.mild.covid.vaxx.dto.PatientEmailRequestDto
import com.mailjet.client.ClientOptions
import com.mailjet.client.MailjetClient
import com.mailjet.client.MailjetRequest
import com.mailjet.client.resource.Emailv31
import mu.KLogging
import org.jetbrains.exposed.sql.transactions.transaction
import org.jetbrains.exposed.sql.update
import org.json.JSONArray
import org.json.JSONObject
import pw.forst.tools.katlib.TimeProvider
import java.time.Instant

class EmailService(
    private val mailJetConfig: MailJetConfigurationDto,
    private val nowProvider: TimeProvider<Instant>
) : DispatchService<PatientEmailRequestDto>(1) {
    // TODO consider populating channel with unsent emails during the init

    private companion object : KLogging()

    suspend fun sendEmail(patientRegistrationDto: PatientEmailRequestDto) {
        insertToChannel(patientRegistrationDto)
    }

    override suspend fun dispatch(work: PatientEmailRequestDto) {
        sendMailBlocking(work)
    }

    private fun sendMailBlocking(emailRequest: PatientEmailRequestDto) {
        val client = MailjetClient(
            mailJetConfig.apiKey,
            mailJetConfig.apiSecret,
            ClientOptions("v3.1")
        )

        val response = client.post(buildEmailRequest(emailRequest))

        if (response.status != 200) {
            // TODO consider putting it back to the channel for retry
            logger.error { "Sending email to ${emailRequest.email} was not successful details: ${response.data}" }
        } else {
            logger.debug { "Email to ${emailRequest.email} sent successfully" }
            // save information about email sent to the database
            transaction {
                Patient.update({ Patient.id eq emailRequest.patientId.toString() }) {
                    it[emailSentDate] = nowProvider.now()
                }
            }
        }
    }

    private fun buildEmailRequest(emailRequest: PatientEmailRequestDto) =
        MailjetRequest(Emailv31.resource)
            .property(
                Emailv31.MESSAGES, JSONArray()
                    .put(
                        JSONObject()
                            .put(
                                Emailv31.Message.FROM, JSONObject()
                                    .put("Email", mailJetConfig.emailFrom)
                                    .put("Name", mailJetConfig.nameFrom)
                            )
                            .put(
                                Emailv31.Message.TO, JSONArray()
                                    .put(
                                        JSONObject()
                                            .put("Email", emailRequest.email)
                                            .put("Name", "${emailRequest.firstName} ${emailRequest.lastName}")
                                    )
                            )
                            .put(Emailv31.Message.SUBJECT, "Testing Subject")
                            .put(
                                Emailv31.Message.TEXTPART, "Dear ${emailRequest.lastName}" +
                                        "You have been registered!"
                            )
                    )
            )
}
