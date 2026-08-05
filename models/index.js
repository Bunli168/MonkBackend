const sequelize = require('../config/database');

// Import models
const Role = require('./Role');
const Kut = require('./Kut');
const User = require('./User');
const UserProfile = require('./UserProfile');
const MonkSurvey = require('./MonkSurvey');
const StudentSurvey = require('./StudentSurvey');
const Address = require('./Address');
const Document = require('./Document');
const OtpSession = require('./OtpSession');
const PasswordResetToken = require('./PasswordResetToken');
const RefreshToken = require('./RefreshToken');
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
const CeremonyEvent = require('./CeremonyEvent');
const EventKutTarget = require('./EventKutTarget');
const EventParticipant = require('./EventParticipant');

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

// 2.5. User <-> MonkSurvey (One-to-One)
User.hasOne(MonkSurvey, { foreignKey: 'user_id' });
MonkSurvey.belongsTo(User, { foreignKey: 'user_id' });

// 2.6. User <-> StudentSurvey (One-to-One)
User.hasOne(StudentSurvey, { foreignKey: 'user_id' });
StudentSurvey.belongsTo(User, { foreignKey: 'user_id' });

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

// Ceremony Events & Duty Scheduling Associations
User.hasMany(CeremonyEvent, { foreignKey: 'created_by', as: 'CreatedCeremonies' });
CeremonyEvent.belongsTo(User, { foreignKey: 'created_by', as: 'Creator' });

CeremonyEvent.hasMany(EventKutTarget, { foreignKey: 'event_id', as: 'KutTargets' });
EventKutTarget.belongsTo(CeremonyEvent, { foreignKey: 'event_id', as: 'CeremonyEvent' });

Kut.hasMany(EventKutTarget, { foreignKey: 'kut_id' });
EventKutTarget.belongsTo(Kut, { foreignKey: 'kut_id' });

CeremonyEvent.hasMany(EventParticipant, { foreignKey: 'event_id', as: 'Participants' });
EventParticipant.belongsTo(CeremonyEvent, { foreignKey: 'event_id', as: 'CeremonyEvent' });

User.hasMany(EventParticipant, { foreignKey: 'user_id', as: 'EventParticipations' });
EventParticipant.belongsTo(User, { foreignKey: 'user_id', as: 'User' });

User.hasMany(EventParticipant, { foreignKey: 'assigned_by', as: 'AssignedParticipants' });
EventParticipant.belongsTo(User, { foreignKey: 'assigned_by', as: 'Assigner' });


module.exports = {
  sequelize,
  Role,
  Kut,
  User,
  UserProfile,
  MonkSurvey,
  StudentSurvey,
  Address,
  Document,
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
  RetreatRegistration,
  CeremonyEvent,
  EventKutTarget,
  EventParticipant
};
