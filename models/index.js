const sequelize = require('../config/database');

// Import models
const Role = require('./Role');
const Kut = require('./Kut');
const User = require('./User');
const UserProfile = require('./UserProfile');
const Address = require('./Address');
const Document = require('./Document');
const Message = require('./Message');
const MessageRecipient = require('./MessageRecipient');
const Report = require('./Report');
const PublicContent = require('./PublicContent');
const OtpSession = require('./OtpSession');
const PasswordResetToken = require('./PasswordResetToken');
const RefreshToken = require('./RefreshToken');

const ReportCategory = require('./ReportCategory');
const Province = require('./Province');
const District = require('./District');
const Commune = require('./Commune');
const Village = require('./Village');
const Attendance = require('./Attendance');
const SeatingRow = require('./SeatingRow');
const EducationYear = require('./EducationYear');
const RetreatEvent = require('./RetreatEvent');
const RetreatRegistration = require('./RetreatRegistration');
const University = require('./University');
const AttendanceRow = require('./AttendanceRow');
const Payment = require('./Payment');
const FinePayment = require('./FinePayment');
const LeaveRequest = require('./LeaveRequest');

// Associations

// 1. Role <-> User (One-to-Many)
Role.hasMany(User, { foreignKey: 'role_id' });
User.belongsTo(Role, { foreignKey: 'role_id' });

// 1.5. User <-> User (Admin creates Students - Self-referencing)
User.hasMany(User, { foreignKey: 'created_by', as: 'CreatedUsers' });
User.belongsTo(User, { foreignKey: 'created_by', as: 'Creator' });

// 2. User <-> UserProfile (One-to-One)
User.hasOne(UserProfile, { foreignKey: 'user_id' });
UserProfile.belongsTo(User, { foreignKey: 'user_id' });

// 3. Kut <-> UserProfile (One-to-Many)
Kut.hasMany(UserProfile, { foreignKey: 'kut_id' });
UserProfile.belongsTo(Kut, { foreignKey: 'kut_id' });

// 4. User <-> Address (One-to-Many)
User.hasMany(Address, { foreignKey: 'user_id' });
Address.belongsTo(User, { foreignKey: 'user_id' });

// 5. User <-> Document (One-to-Many)
User.hasMany(Document, { foreignKey: 'user_id' });
Document.belongsTo(User, { foreignKey: 'user_id' });

// 5.5 User <-> LeaveRequest (One-to-Many)
User.hasMany(LeaveRequest, { foreignKey: 'user_id' });
LeaveRequest.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(LeaveRequest, { foreignKey: 'approved_by', as: 'ApprovedLeaves' });
LeaveRequest.belongsTo(User, { foreignKey: 'approved_by', as: 'Approver' });

// 6. Kut <-> Event (One-to-Many) removed
// 7. Event <-> EventAttendee (One-to-Many) removed
// 8. User <-> EventAttendee (User attending & Assigned by) removed

// 10. User <-> Message (Sender)
User.hasMany(Message, { foreignKey: 'sender_id' });
Message.belongsTo(User, { foreignKey: 'sender_id' });

// 11. Message <-> MessageRecipient (One-to-Many)
Message.hasMany(MessageRecipient, { foreignKey: 'message_id' });
MessageRecipient.belongsTo(Message, { foreignKey: 'message_id' });

// 12. User <-> MessageRecipient (Receiver)
User.hasMany(MessageRecipient, { foreignKey: 'receiver_id' });
MessageRecipient.belongsTo(User, { foreignKey: 'receiver_id' });

// 13. Kut <-> Report (One-to-Many)
Kut.hasMany(Report, { foreignKey: 'kut_id' });
Report.belongsTo(Kut, { foreignKey: 'kut_id' });

// 14. User <-> Report (Reporter)
User.hasMany(Report, { foreignKey: 'reported_by' });
Report.belongsTo(User, { foreignKey: 'reported_by', as: 'Reporter' });

// ReportCategory <-> Report (One-to-Many)
ReportCategory.hasMany(Report, { foreignKey: 'category_id' });
Report.belongsTo(ReportCategory, { foreignKey: 'category_id', as: 'category' });

// 15. User <-> PublicContent (Publisher)
User.hasMany(PublicContent, { foreignKey: 'published_by' });
PublicContent.belongsTo(User, { foreignKey: 'published_by' });

// Token Associations
User.hasMany(OtpSession, { foreignKey: 'user_id' });
OtpSession.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(PasswordResetToken, { foreignKey: 'user_id' });
PasswordResetToken.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(RefreshToken, { foreignKey: 'user_id' });
RefreshToken.belongsTo(User, { foreignKey: 'user_id' });

// Fine Payment Associations
User.hasMany(FinePayment, { foreignKey: 'user_id', as: 'FinePayments' });
FinePayment.belongsTo(User, { foreignKey: 'user_id', as: 'Payer' });

User.hasMany(FinePayment, { foreignKey: 'collected_by', as: 'CollectedFines' });
FinePayment.belongsTo(User, { foreignKey: 'collected_by', as: 'Collector' });



// 18. Location Table Associations
// Province <-> District (One-to-Many)
Province.hasMany(District, { foreignKey: 'province_id' });
District.belongsTo(Province, { foreignKey: 'province_id' });

// District <-> Commune (One-to-Many)
District.hasMany(Commune, { foreignKey: 'district_id' });
Commune.belongsTo(District, { foreignKey: 'district_id' });

// Commune <-> Village (One-to-Many)
Commune.hasMany(Village, { foreignKey: 'commune_id' });
Village.belongsTo(Commune, { foreignKey: 'commune_id' });

// AttendanceRow Associations
AttendanceRow.belongsTo(Kut, { foreignKey: 'kut_id' });
AttendanceRow.belongsTo(User, { as: 'taker', foreignKey: 'taker_id' });
AttendanceRow.hasMany(Attendance, { foreignKey: 'row_id' });

Kut.hasMany(Attendance, { foreignKey: 'kut_id' });
Attendance.belongsTo(Kut, { foreignKey: 'kut_id' });

// SeatingRow Associations


User.hasMany(SeatingRow, { foreignKey: 'assigned_taker_id', as: 'AssignedRows' });
SeatingRow.belongsTo(User, { foreignKey: 'assigned_taker_id', as: 'AssignedTaker' });

// UserProfile <-> SeatingRow
SeatingRow.hasMany(UserProfile, { foreignKey: 'seating_row_id' });
UserProfile.belongsTo(SeatingRow, { foreignKey: 'seating_row_id' });

// Payment Associations
User.hasMany(Payment, { foreignKey: 'user_id' });
Payment.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(Payment, { foreignKey: 'collected_by', as: 'CollectedPayments' });
Payment.belongsTo(User, { foreignKey: 'collected_by', as: 'Collector' });

EducationYear.hasMany(Payment, { foreignKey: 'education_year_id' });
Payment.belongsTo(EducationYear, { foreignKey: 'education_year_id' });

// Attendance <-> User Associations
User.hasMany(Attendance, { foreignKey: 'user_id' });
Attendance.belongsTo(User, { foreignKey: 'user_id' });

EducationYear.hasMany(Attendance, { foreignKey: 'education_year_id' });
Attendance.belongsTo(EducationYear, { foreignKey: 'education_year_id' });

// Address <-> Province, District, Commune (Many-to-One)
Province.hasMany(Address, { foreignKey: 'province_id' });
Address.belongsTo(Province, { foreignKey: 'province_id' });

District.hasMany(Address, { foreignKey: 'district_id' });
Address.belongsTo(District, { foreignKey: 'district_id' });

Commune.hasMany(Address, { foreignKey: 'commune_id' });
Address.belongsTo(Commune, { foreignKey: 'commune_id' });

// Retreat Event Associations
RetreatEvent.hasMany(RetreatRegistration, { foreignKey: 'retreat_event_id' });
RetreatRegistration.belongsTo(RetreatEvent, { foreignKey: 'retreat_event_id' });

User.hasMany(RetreatRegistration, { foreignKey: 'user_id' });
RetreatRegistration.belongsTo(User, { foreignKey: 'user_id' });

SeatingRow.hasMany(RetreatRegistration, { foreignKey: 'seating_row_id' });
RetreatRegistration.belongsTo(SeatingRow, { foreignKey: 'seating_row_id' });

RetreatEvent.hasMany(Attendance, { foreignKey: 'retreat_event_id' });
Attendance.belongsTo(RetreatEvent, { foreignKey: 'retreat_event_id' });

RetreatEvent.hasMany(Payment, { foreignKey: 'retreat_event_id' });
Payment.belongsTo(RetreatEvent, { foreignKey: 'retreat_event_id' });

module.exports = {
  sequelize,
  Role,
  Kut,
  User,
  UserProfile,
  Address,
  Document,
  Message,
  MessageRecipient,
  Report,
  ReportCategory,
  PublicContent,
  OtpSession,
  PasswordResetToken,
  RefreshToken,
  Province,
  District,
  Commune,
  Village,
  Attendance,
  AttendanceRow,
  SeatingRow,
  EducationYear,
  University,
  Payment,
  FinePayment,
  LeaveRequest,
  RetreatEvent,
  RetreatRegistration
};
