package blue.mild.covid.vaxx.service

import blue.mild.covid.vaxx.dto.internal.IsinValidationResultDto
import blue.mild.covid.vaxx.dto.internal.PatientValidationResult
import mu.KLogging


class IsinValidationService(
    private val isinService: IsinServiceInterface
) : PatientValidationService {

    private enum class VyhledaniPacientaResult {
        PacientNalezen,
        NalezenoVicePacientu,
        PacientNebylNalezen,
        CizinecZaloz,
        ChybaVstupnichDat,
        Chyba
    }

    private companion object : KLogging()

    override suspend fun validatePatient(
        firstName: String,
        lastName: String,
        personalNumber: String
    ): IsinValidationResultDto {
        val result = runCatching {
            isinService.getPatientByParameters(
                firstName = firstName,
                lastName = lastName,
                personalNumber = personalNumber
            )
        }.onSuccess {
            logger.info { "Data retrieval from ISIN - success." }
        }.onFailure {
            logger.warn { "Data retrieval from ISIN - failure." }
            // TODO #287 we think that this is the place which produces stack overflow
            val wrappingException =
                Exception("An exception ${it.javaClass.canonicalName} was thrown! - ${it.message}\n${it.stackTraceToString()}")
            logger.error(wrappingException) {
                "Getting data from ISIN server failed for patient ${firstName}/${lastName}/${personalNumber}"
            }
        }.getOrNull() ?: return IsinValidationResultDto(status = PatientValidationResult.WAS_NOT_VERIFIED)

        logger.info {
            "Data from ISIN for patient ${firstName}/${lastName}/${personalNumber}: " +
            "result=${result.result}, resultMessage=${result.resultMessage}, patientId=${result.patientId}."
        }

        return when (result.result) {
            VyhledaniPacientaResult.PacientNalezen.name,
            VyhledaniPacientaResult.NalezenoVicePacientu.name ->
                IsinValidationResultDto(
                    status = PatientValidationResult.PATIENT_FOUND,
                    patientId = result.patientId
                )
            VyhledaniPacientaResult.PacientNebylNalezen.name,
            VyhledaniPacientaResult.ChybaVstupnichDat.name ->
                IsinValidationResultDto(
                    status = PatientValidationResult.PATIENT_NOT_FOUND
                )
            else ->
                IsinValidationResultDto(
                    status = PatientValidationResult.WAS_NOT_VERIFIED
                )
        }
    }
}
