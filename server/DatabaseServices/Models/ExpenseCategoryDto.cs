using System.Runtime.Intrinsics.X86;

namespace DatabaseServices.Models;

public class ExpenseCategoryDto
{
    public int Id { get; set; }
 
    public string Name { get; set; } = string.Empty;

    public string CreatedAt { get; set; } = string.Empty;

    public string UpdatedAt { get; set; } = string.Empty;

    public decimal CategoryTotalSpent { get; set; } = 0;

    public bool Active { get; set; } = true;
}
