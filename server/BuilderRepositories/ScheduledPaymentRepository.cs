using System.Data;
using DatabaseServices;
using DatabaseServices.Models;

namespace BuilderRepositories;

public class ScheduledPaymentRepository : BuilderRepository
{
    private readonly DatabaseService _dbService;

    public ScheduledPaymentRepository(DatabaseService dbService) : base(dbService)
    {
        _dbService = dbService;
    }

    public async Task SchedulePaymentAsync(int expenseId, string dueDate, int? creditCardId = null)
    {
        var sql = @"INSERT INTO scheduled_payments (expense_id, scheduled_due_date, credit_card_id)
                    VALUE (@expenseId, @dueDate, @creditCardId)";
        var parameters = new Dictionary<string, object?>
        {
            { "@expenseId", expenseId },
            { "@dueDate", dueDate },
            { "@creditCardId", creditCardId }
        };

        await _dbService.ExecuteAsync(sql, parameters).ConfigureAwait(false);
    }

    public async Task<List<ScheduledPaymentDto>> GetScheduledPaymentsForTodayAsync(int userId)
    {
        var today = DateOnly.FromDateTime(DateTime.Today).ToString("yyyy-MM-dd");
        var sql = @"SELECT
                        *
                    FROM scheduled_payments
                    WHERE user_id = @userId
                        AND scheduled_due_date = @today";
        var parameters = new Dictionary<string, object?>
        {
            { "@userId", userId },
            { "@today", today }
        };

        var dataTable = await _dbService.QueryAsync(sql, parameters).ConfigureAwait(false);

        return dataTable.MapList(row => new ScheduledPaymentDto
        {
            Id = row.Field<int>("id"),
            ExpenseId = row.Field<int>("expense_id"),
            CreditCardId = row.Field<int>("credit_card_id"),
            ScheduledDueDate = row.Field<DateTime>("scheduled_due_date").ToString("yyyy-MM-dd")
        }) ?? [];
    }
}