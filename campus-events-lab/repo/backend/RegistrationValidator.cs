namespace CampusEvents.Backend;

/// <summary>Abstraction over the database so the validator can be unit tested with a mock.</summary>
public interface IEventRepository
{
    int GetSeatLimit(int eventId);          // returns -1 if the event does not exist
    int GetConfirmedCount(int eventId);
}

public class RegistrationValidator
{
    public const string AllowedDomain = "@univ.edu.ph";
    private readonly IEventRepository _repo;

    public RegistrationValidator(IEventRepository repo) => _repo = repo;

    public bool IsValidStudentEmail(string? email)
    {
        if (string.IsNullOrWhiteSpace(email)) return false;
        email = email.Trim();
        if (email.Any(char.IsWhiteSpace)) return false;
        if (!email.EndsWith(AllowedDomain, StringComparison.OrdinalIgnoreCase)) return false;

        string local = email[..^AllowedDomain.Length];
        return local.Length > 0 && !local.Contains('@');
    }

    // Student numbers: letters, digits and hyphens, 6 to 15 characters (for example 2023-00123).
    public bool IsValidStudentNumber(string? studentNumber) =>
        !string.IsNullOrWhiteSpace(studentNumber) &&
        System.Text.RegularExpressions.Regex.IsMatch(studentNumber.Trim(), "^[A-Za-z0-9-]{6,15}$");

    public bool HasSeatAvailable(int eventId)
    {
        int limit = _repo.GetSeatLimit(eventId);
        if (limit < 0) return false;
        return _repo.GetConfirmedCount(eventId) < limit;
    }
}
