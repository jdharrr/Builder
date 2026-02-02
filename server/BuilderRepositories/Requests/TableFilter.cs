using BuilderServices.Enums;

namespace BuilderRepositories.Requests;

public class TableFilter
{
    public TableFilterType FilterType { get; set; }
    
    public string FilterColumn { get; set; }
    
    public string? Value1 { get; set; }
    
    public string? Value2 { get; set; }
}