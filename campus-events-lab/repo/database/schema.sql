/* =====================================================================
   Online Campus Event Management System - schema (SQL Server / T-SQL)
   3NF: every non-key column depends on the key, the whole key, and
   nothing but the key. Venue data is split out of Events so venue
   name/capacity are not repeated on every event row.
   ===================================================================== */
IF DB_ID(N'CampusEvents') IS NULL CREATE DATABASE CampusEvents;
GO
USE CampusEvents;
GO

CREATE TABLE dbo.Users (
    UserId     INT IDENTITY(1,1) NOT NULL,
    FullName   NVARCHAR(120)     NOT NULL,
    StudentNumber VARCHAR(15)    NULL,          -- NULL for admins
    Email      NVARCHAR(254)     NOT NULL,
    Role       VARCHAR(10)       NOT NULL CONSTRAINT DF_Users_Role DEFAULT 'Student',
    CreatedAt  DATETIME2(0)      NOT NULL CONSTRAINT DF_Users_CreatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_Users PRIMARY KEY CLUSTERED (UserId),
    CONSTRAINT UQ_Users_Email UNIQUE (Email),
    CONSTRAINT CK_Users_StudentNumber CHECK (StudentNumber IS NULL OR (LEN(StudentNumber) >= 6 AND StudentNumber NOT LIKE '%[^A-Za-z0-9-]%')),
    CONSTRAINT CK_Users_Role CHECK (Role IN ('Student', 'Admin')),
    CONSTRAINT CK_Users_Email CHECK (Email LIKE '%_@_%._%' AND Email NOT LIKE '% %')
);
GO

CREATE TABLE dbo.Venues (
    VenueId   INT IDENTITY(1,1) NOT NULL,
    Name      NVARCHAR(120)     NOT NULL,
    Capacity  INT               NOT NULL,
    CONSTRAINT PK_Venues PRIMARY KEY CLUSTERED (VenueId),
    CONSTRAINT UQ_Venues_Name UNIQUE (Name),
    CONSTRAINT CK_Venues_Capacity CHECK (Capacity > 0)
);
GO

CREATE TABLE dbo.Events (
    EventId      INT IDENTITY(1,1) NOT NULL,
    Title        NVARCHAR(150)     NOT NULL,
    Description  NVARCHAR(1000)    NULL,
    VenueId      INT               NOT NULL,
    CreatedBy    INT               NOT NULL,
    StartsAt     DATETIME2(0)      NOT NULL,
    EndsAt       DATETIME2(0)      NOT NULL,
    SeatLimit    INT               NOT NULL,
    CONSTRAINT PK_Events PRIMARY KEY CLUSTERED (EventId),
    CONSTRAINT FK_Events_Venues FOREIGN KEY (VenueId)   REFERENCES dbo.Venues (VenueId) ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT FK_Events_Users  FOREIGN KEY (CreatedBy) REFERENCES dbo.Users  (UserId)  ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT CK_Events_Dates     CHECK (EndsAt > StartsAt),
    CONSTRAINT CK_Events_SeatLimit CHECK (SeatLimit > 0)
);
GO

CREATE TABLE dbo.Registrations (
    RegistrationId INT IDENTITY(1,1) NOT NULL,
    EventId        INT               NOT NULL,
    UserId         INT               NOT NULL,
    Status         VARCHAR(10)       NOT NULL CONSTRAINT DF_Registrations_Status DEFAULT 'Confirmed',
    RegisteredAt   DATETIME2(0)      NOT NULL CONSTRAINT DF_Registrations_At DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_Registrations PRIMARY KEY CLUSTERED (RegistrationId),
    CONSTRAINT FK_Registrations_Events FOREIGN KEY (EventId) REFERENCES dbo.Events (EventId) ON DELETE CASCADE   ON UPDATE NO ACTION,
    CONSTRAINT FK_Registrations_Users  FOREIGN KEY (UserId)  REFERENCES dbo.Users  (UserId)  ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT UQ_Registrations_Event_User UNIQUE (EventId, UserId),   -- one registration per student per event
    CONSTRAINT CK_Registrations_Status CHECK (Status IN ('Confirmed', 'Cancelled'))
);
GO

/* Non-clustered indexes on every foreign key column (speeds up joins and FK checks) */
CREATE NONCLUSTERED INDEX IX_Events_VenueId          ON dbo.Events (VenueId);
CREATE NONCLUSTERED INDEX IX_Events_CreatedBy        ON dbo.Events (CreatedBy);
CREATE NONCLUSTERED INDEX IX_Registrations_EventId   ON dbo.Registrations (EventId);
CREATE NONCLUSTERED INDEX IX_Registrations_UserId    ON dbo.Registrations (UserId);

/* Student numbers are unique when present (filtered index allows many NULL admins) */
CREATE UNIQUE NONCLUSTERED INDEX UX_Users_StudentNumber ON dbo.Users (StudentNumber) WHERE StudentNumber IS NOT NULL;

/* Supports "upcoming events" listing */
CREATE NONCLUSTERED INDEX IX_Events_StartsAt ON dbo.Events (StartsAt) INCLUDE (Title, VenueId, SeatLimit);
GO
