namespace BuilderServices.Requests;

public class FilterRequest
{
    public required string Filter { get; set; }
    
    public string? Value1 { get; set; }
    
    public string? Value2 { get; set; }
}