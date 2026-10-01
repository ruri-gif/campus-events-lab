using CampusEvents.Backend;
using Moq;
using Xunit;

namespace CampusEvents.Tests;

public class RegistrationValidatorTests
{
    private static RegistrationValidator Create(int seatLimit = 10, int confirmed = 0, int eventId = 1)
    {
        var repo = new Mock<IEventRepository>();
        repo.Setup(r => r.GetSeatLimit(eventId)).Returns(seatLimit);
        repo.Setup(r => r.GetConfirmedCount(eventId)).Returns(confirmed);
        return new RegistrationValidator(repo.Object);
    }

    [Theory]
    [InlineData("juan.delacruz@univ.edu.ph")]
    [InlineData("  maria@univ.edu.ph  ")]
    [InlineData("MARIA@UNIV.EDU.PH")]
    public void IsValidStudentEmail_AcceptsUniversityEmails(string email)
        => Assert.True(Create().IsValidStudentEmail(email));

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("juan@gmail.com")]
    [InlineData("@univ.edu.ph")]
    [InlineData("a@b@univ.edu.ph")]
    [InlineData("juan@univ.edu.ph.evil.com")]
    [InlineData("ju an@univ.edu.ph")]
    public void IsValidStudentEmail_RejectsInvalidEmails(string? email)
        => Assert.False(Create().IsValidStudentEmail(email));

    [Theory]
    [InlineData("2023-00123")]
    [InlineData("  20230123  ")]
    public void IsValidStudentNumber_AcceptsValidNumbers(string value)
        => Assert.True(Create().IsValidStudentNumber(value));

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("12345")]
    [InlineData("2023 00123")]
    [InlineData("2023-00123'; DROP TABLE Users;--")]
    public void IsValidStudentNumber_RejectsInvalidNumbers(string? value)
        => Assert.False(Create().IsValidStudentNumber(value));

    [Fact]
    public void HasSeatAvailable_True_WhenBelowLimit()
        => Assert.True(Create(seatLimit: 10, confirmed: 9).HasSeatAvailable(1));

    [Fact]
    public void HasSeatAvailable_False_WhenFull()
        => Assert.False(Create(seatLimit: 10, confirmed: 10).HasSeatAvailable(1));

    [Fact]
    public void HasSeatAvailable_False_WhenEventDoesNotExist()
    {
        var repo = new Mock<IEventRepository>();
        repo.Setup(r => r.GetSeatLimit(99)).Returns(-1);
        var validator = new RegistrationValidator(repo.Object);

        Assert.False(validator.HasSeatAvailable(99));
        repo.Verify(r => r.GetConfirmedCount(It.IsAny<int>()), Times.Never); // short-circuits
    }

    [Fact]
    public void HasSeatAvailable_AsksRepositoryExactlyOnce()
    {
        var repo = new Mock<IEventRepository>();
        repo.Setup(r => r.GetSeatLimit(1)).Returns(5);
        repo.Setup(r => r.GetConfirmedCount(1)).Returns(2);

        new RegistrationValidator(repo.Object).HasSeatAvailable(1);

        repo.Verify(r => r.GetSeatLimit(1), Times.Once);
        repo.Verify(r => r.GetConfirmedCount(1), Times.Once);
    }
}
