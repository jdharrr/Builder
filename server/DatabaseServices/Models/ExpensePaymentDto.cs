namespace DatabaseServices.Models;

public class ExpensePaymentDto
{
    public int ExpenseId { get; set; } = 0;

    public int UserId { get; set; } = 0;

    public double Cost { get; set; } = 0.0;

    public string PaymentDate { get; set; } = string.Empty;

    public string DueDatePaid { get; set; } = string.Empty;
}
