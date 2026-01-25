using System.Data;
using System.Diagnostics;
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

    public async Task<List<ScheduledPaymentDto>> GetScheduledPaymentsToPayAsync(int userId)
    {
        var today = DateOnly.FromDateTime(DateTime.Today).ToString("yyyy-MM-dd");
        var sql = @"SELECT
                        sp.*
                    FROM scheduled_payments sp
                    INNER JOIN expenses e
                        ON sp.expense_id = e.id
                        AND e.active = 1
                        AND (e.end_date IS NULL OR DATE(e.end_date) >= DATE(sp.scheduled_due_date))
                    LEFT JOIN expense_payments ep
                        ON sp.expense_id = ep.expense_id
                        AND sp.scheduled_due_date = ep.due_date_paid
                    WHERE e.user_id = @userId
                        AND DATE(sp.scheduled_due_date) <= @today
                        AND ep.expense_id IS NULL";
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
            CreditCardId = row.Field<int?>("credit_card_id"),
            ScheduledDueDate = row.Field<DateTime>("scheduled_due_date").ToString("yyyy-MM-dd")
        }) ?? [];
    }

    public async Task<ScheduledPaymentDto?> GetScheduledPaymentAsync(int expenseId, string dueDate)
    {
        var sql = @"SELECT
                        *
                    FROM scheduled_payments
                    WHERE expense_id = @expenseId
                        AND scheduled_due_date = @dueDate";
        var parameters = new Dictionary<string, object?>
        {
            { "@expenseId", expenseId },
            { "@dueDate", dueDate }
        };

        var dataTable = await _dbService.QueryAsync(sql, parameters).ConfigureAwait(false);

        return dataTable.MapSingle(row => new ScheduledPaymentDto
        {
            Id = row.Field<int>("id"),
            ExpenseId = row.Field<int>("expense_id"),
            CreditCardId = row.Field<int?>("credit_card_id"),
            ScheduledDueDate = row.Field<DateTime>("scheduled_due_date").ToString("yyyy-MM-dd")
        });
    }

    public async Task UpdateCreditCardIdAsync(int scheduledPaymentId, int? creditCardId)
    {
        var sql = @"UPDATE scheduled_payments
                    SET credit_card_id = @creditCardId
                    WHERE id = @scheduledPaymentId";
        var parameters = new Dictionary<string, object?>
        {
            { "@creditCardId", creditCardId },
            { "@scheduledPaymentId", scheduledPaymentId }
        };

        await _dbService.ExecuteAsync(sql, parameters).ConfigureAwait(false);
    }

    public async Task DeleteScheduledPaymentByDueDateAsync(int expenseId, string dueDate)
    {
        var sql = @"DELETE FROM scheduled_payments
                    WHERE expense_id = @expenseId
                        AND scheduled_due_date = @dueDate";
        var parameters = new Dictionary<string, object?>
        {
            { "@expenseId", expenseId },
            { "@dueDate", dueDate }
        };

        await _dbService.ExecuteAsync(sql, parameters).ConfigureAwait(false);
    }
    
    public async Task DeleteScheduledPaymentByIdAsync(int scheduledPaymentId)
    {
        var sql = @"DELETE FROM scheduled_payments
                    WHERE id = @scheduledPaymentId";
        var parameters = new Dictionary<string, object?>
        {
            { "@scheduledPaymentId", scheduledPaymentId }
        };

        await _dbService.ExecuteAsync(sql, parameters).ConfigureAwait(false);
    }
}