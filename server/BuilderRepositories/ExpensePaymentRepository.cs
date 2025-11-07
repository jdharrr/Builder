using DatabaseServices;
using DatabaseServices.Models;
using DatabaseServices.Repsonses;
using Microsoft.VisualBasic;
using MySql.Data.MySqlClient;
using System.Data;

namespace BuilderRepositories;

public class ExpensePaymentRepository
{
    private readonly DatabaseService _dbService;

    public ExpensePaymentRepository(DatabaseService dbService)
    {
        _dbService = dbService;
    }

    public async Task<long> CreateExpensePaymentAsync(ExpensePaymentDto dto)
    {
        var sql = @"INSERT INTO expense_payments (
                    expense_id,
                    user_id,
                    cost,
                    payment_date,
                    due_date_paid
                ) VALUES(
                    @expenseId,
                    @userId,
                    @cost,
                    @paymentDate,
                    @dueDatePaid
                )";
        var parameters = new Dictionary<string, object?>()
        {
            { "@expenseId", dto.ExpenseId },
            { "@userId", dto.UserId },
            { "@cost", dto.Cost },
            { "@paymentDate", dto.PaymentDate },
            { "@dueDatePaid", dto.DueDatePaid }
        };

        var result = new ExecuteResponse();
        try 
        {
            result = await _dbService.ExecuteAsync(sql, parameters).ConfigureAwait(false);
        }
        catch (MySqlException ex) when (ex.Number == 2627 || ex.Number == 2601)
        {
            if (ex.Message.Contains("user_expense_duedatepaid"))
            {
                throw new GenericException("This expense due date has already been paid.");
            }
        }

        return result.LastInsertedId;
    }

    public async Task<bool> DeleteExpensePaymentAsync(ExpensePaymentDto dto)
    {
        var sql = @"DELETE FROM expense_payments
                    WHERE user_id = @userId
                        AND DATE(due_date_paid) = @dueDate
                        AND expense_id = @expenseId";
        var parameters = new Dictionary<string, object?>()
        {
            { "@userId", dto.UserId },
            { "@dueDate", dto.DueDatePaid },
            { "@expenseId", dto.ExpenseId }
        };

        var result = await _dbService.ExecuteAsync(sql, parameters).ConfigureAwait(false);
        return result.RowsAffected > 0;
    }

    public async Task<ExpensePaymentDto?> GetExpensePaymentByDueDateAsync(ExpensePaymentDto dto)
    {
        var sql = @"SELECT id, expense_id, cost, payment_date, due_date_paid FROM expense_payments
                    WHERE user_id = @userId
                        AND due_date_paid = @dueDate
                        AND expense_id = @expenseId";
        var parameters = new Dictionary<string, object?>()
        {
            { "@userId", dto.UserId },
            { "@dueDate", dto.DueDatePaid },
            { "@expenseId", dto.ExpenseId }
        };

        var dataTable = await _dbService.QueryAsync(sql, parameters).ConfigureAwait(false);

        return dataTable.MapSingle(row => new ExpensePaymentDto
        {
            Id = row.Field<int>("id"),
            ExpenseId = row.Field<int>("expense_id"),
            Cost = (double)row.Field<decimal>("cost"),
            PaymentDate = row.Field<DateTime>("payment_date").ToString("yyyy-MM-dd") ?? string.Empty,
            DueDatePaid = row.Field<DateTime>("due_date_paid").ToString("yyyy-MM-dd") ?? string.Empty
        });
    }

    public async Task<List<ExpensePaymentDto>> GetPaymentsForDateAsync(DateOnly dueDatePaid, int userId)
    {
        var sql = @"SELECT * FROM expense_payments
                    WHERE user_id = @userId
                    AND due_date_paid = @dueDatePaid";
        var parameters = new Dictionary<string, object?>()
        {
            { "@userId", userId },
            { "@dueDatePaid", dueDatePaid.ToString("yyyy-MM-dd") }
        };

        var dataTable = await _dbService.QueryAsync(sql, parameters).ConfigureAwait(false);

        return dataTable.MapList(row => new ExpensePaymentDto
        {
            Id = row.Field<int>("id"),
            ExpenseId = Convert.ToInt32(row["expense_id"]),
            Cost = Convert.ToDouble(row["cost"]),
            PaymentDate = row.Field<DateTime>("payment_date").ToString("yyyy-MM-dd"),
            DueDatePaid = row.Field<DateTime>("due_date_paid").ToString("yyyy-MM-dd")
        }) ?? [];
    }

    public async Task<List<ExpensePaymentDto>> GetPaymentsForExpenseAsync(int expenseId, int userId)
    {
        var sql = @"SELECT * FROM expense_payments
                    WHERE user_id = @userId
                    AND expense_id = @expenseId
                  ";
        var parameters = new Dictionary<string, object?>()
        {
            { "@userId", userId },
            { "@expenseId", expenseId }
        };

        var dataTable = await _dbService.QueryAsync(sql, parameters).ConfigureAwait(false);
        
        return dataTable.MapList(row => new ExpensePaymentDto
        {
            Id = row.Field<int>("id"),
            ExpenseId = Convert.ToInt32(row["expense_id"]),
            Cost = Convert.ToDouble(row["cost"]),
            PaymentDate = row.Field<DateTime>("payment_date").ToString("yyyy-MM-dd"),
            DueDatePaid = row.Field<DateTime>("due_date_paid").ToString("yyyy-MM-dd")
        }) ?? [];
    }

    public async Task<double> GetTotalSpentForRangeAsync(int userId, DateOnly? startDate = null, DateOnly? endDate = null)
    {
        var sql = @"SELECT COALESCE(SUM(cost), 0.0) AS total_spent 
                    FROM expense_payments
                    WHERE user_id = @userId";

        var parameters = new Dictionary<string, object?>()
        {
            { "@userId", userId }
        };

        if (startDate != null && endDate != null)
        {
            sql += " AND payment_date >= @startDate AND payment_date <= @endDate";
            parameters.Add("@startDate", startDate?.ToString("yyyy-MM-dd"));
            parameters.Add("@endDate", endDate?.ToString("yyyy-MM-dd"));
        }

        var dataTable = await _dbService.QueryAsync(sql, parameters).ConfigureAwait(false);

        return dataTable?.MapSingle(row => (double)row.Field<decimal>("total_spent")) ?? 0.0;
    }
}