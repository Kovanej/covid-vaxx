package blue.mild.covid.vaxx.dao

import org.jetbrains.exposed.sql.Table

object Patient : Table() {
    val id = varchar("id", 36)

    val firstName = varchar("first_name", 256)
    val lastName = varchar("last_name", 256)
    val personalNumber = varchar("personal_number", 11)
    val phoneNumber = varchar("phone_number", 13)
    val email = varchar("email", 256)

    override val primaryKey = PrimaryKey(id)
}
