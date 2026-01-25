namespace DatabaseServices.Models;

public class ExpensePaymentDto
{
    public int Id { get; set; } = 0;

    public int ExpenseId { get; set; } = 0;

    public int UserId { get; set; } = 0;

    public decimal Cost { get; set; } = 0;

    public string PaymentDate { get; set; } = string.Empty;

    public string DueDatePaid { get; set; } = string.Empty;

    public bool Skipped { get; set; } = false;
}
