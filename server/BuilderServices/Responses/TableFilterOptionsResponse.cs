namespace BuilderServices.Responses;

public class TableFilterOptionsResponse
{
    public List<TableFilterOptionResponse> FilterOptions { get; set; } = [];
}

public class TableFilterOptionResponse
{
    public required string Filter { get; set; }
    
    public required string DisplayText { get; set; }
    
    public required string FilterType { get; set; }
}