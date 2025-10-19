﻿using DatabaseServices;
using DatabaseServices.Models;
using DatabaseServices.Repsonses;
using MySql.Data.MySqlClient;
using System.Data;

namespace BuilderRepositories;

public class ExpenseRepository : BuilderRepository
{
    private readonly DatabaseService _dbService;

    public ExpenseRepository(DatabaseService dbService) : base(dbService)
    {
        _dbService = dbService;
    }

    public async Task<long> CreateExpenseAsync(ExpenseDto dto, int userId)
    {
        var sql = @"INSERT INTO expenses (
                    name,
                    cost,
                    description,
                    recurrence_rate,
                    next_due_date,
                    user_id,
                    start_date,
                    end_date,
                    category_id,
                    due_end_of_month
                ) VALUES(
                    @name,
                    @cost,
                    @description,
                    @recurrenceRate,
                    @nextDueDate,
                    @userId,
                    @startDate,
                    @endDate,
                    @categoryId,
                    @dueLastDayOfMonth
                )";

        var parameters = new Dictionary<string, object?>()
        {
            { "@name", dto.Name },
            { "@cost", dto.Cost },
            { "@description", dto.Description },
            { "@recurrenceRate", dto.RecurrenceRate },
            { "@nextDueDate", dto.StartDate },
            { "@userId", userId },
            { "@startDate", dto.StartDate },
            { "@endDate", DBNull.Value },
            { "@categoryId", dto.CategoryId ?? 0 },
            { "@dueLastDayOfMonth", dto.DueEndOfMonth }
        };

        if (!string.IsNullOrEmpty(dto.EndDate))
            parameters["@endDate"] = dto.EndDate;

        ExecuteResponse result;
        try
        {
            result = await _dbService.ExecuteAsync(sql, parameters).ConfigureAwait(false);
        }
        catch (MySqlException ex) when (ex.Number == 2627 || ex.Number == 2601)
        {
            if (ex.Message.Contains("name"))
            {
                throw new GenericException("An expense with this name already exists.");
            }
            
            throw;
        }

        return result.LastInsertedId;
    }

    public async Task<ExpenseDto?> GetExpenseByIdAsync(int expenseId, int userId)
    {
        var sql = @"SELECT
                    id,
                    name,
                    cost,
                    description,
                    recurrence_rate,
                    last_cost,
                    cost_updated_at,
                    created_at,
                    updated_at,
                    next_due_date,
                    active,
                    start_date,
                    end_date,
                    category_id,
                    due_end_of_month
                FROM expenses
                WHERE id = @expenseId 
                    AND user_id = @userId";
        var parameters = new Dictionary<string, object?>()
        {
            { "@expenseId", expenseId },
            { "@userId", userId }
        };

        var dataTable = await _dbService.QueryAsync(sql, parameters).ConfigureAwait(false);
        if (dataTable.Rows.Count == 0)
        {
            return null;
        }

        return dataTable.MapSingle(row => new ExpenseDto
        {
            Id = row.Field<int>("id"),
            Name = row.Field<string>("name") ?? "Unknown Expense",
            Cost = row.Field<double>("cost"),
            Description = row.Field<string?>("description") ?? string.Empty,
            RecurrenceRate = row.Field<string>("recurrence_rate") ?? "once",
            LastCost = row.Field<double?>("last_cost"),
            CostUpdatedAt = row.Field<DateTime?>("cost_updated_at")?.ToString("yyyy-MM-dd"),
            CreatedAt = row.Field<DateTime>("created_at").ToString("yyyy-MM-dd"),
            UpdatedAt = row.Field<DateTime>("updated_at").ToString("yyyy-MM-dd"),
            NextDueDate = row.Field<DateTime?>("next_due_date")?.ToString("yyyy-MM-dd"),
            Active = row.Field<bool>("active"),
            StartDate = row.Field<DateTime>("start_date")!.ToString("yyyy-MM-dd"),
            EndDate = row.Field<string?>("end_date"),
            CategoryId = row.Field<int?>("category_id")
        });
    }

    public async Task<bool> UpdateExpenseAsync(Dictionary<string, object?> updateColumns, int expenseId, int userId)
    {
        var allowedUpdateFields = new HashSet<string>
        {
            "name",
            "cost",
            "description",
            "last_cost",
            "cost_updated_at",
            "next_due_date",
            "active",
            "start_date",
            "end_date",
            "category_id",
            "recurrence_rate"
        };

        if (updateColumns.Where(x => !allowedUpdateFields.Contains(x.Key)).Any())
            throw new GenericException("Invalid update request.");

        var sql = @"UPDATE expenses SET ";

        foreach (var column in updateColumns.Keys)
        {
            sql += @$"{column} = @{column},";
        }

        sql = sql.TrimEnd(',');
        sql += " WHERE id = @expenseId AND user_id = @userId";

        var parameters = new Dictionary<string, object?>(updateColumns)
        {
            { "@expenseId", expenseId },
            { "@userId", userId }
        };

        foreach (var kvp in updateColumns)
        {
            parameters[$"@{kvp.Key}"] = kvp.Value;
        }

        var result = await _dbService.ExecuteAsync(sql, parameters).ConfigureAwait(false);

        return result.RowsAffected > 0;
    }

    public async Task<List<ExpenseDto>> GetExpensesForDateRangeAsync(int userId, DateOnly firstDate, DateOnly lastDate)
    {
        var sql = @"SELECT 
                    e.*, 
                    c.name as category_name, 
                    IF(DATE(e.next_due_date) < CURDATE(), TRUE, FALSE) as is_late
                    FROM expenses e
                    LEFT JOIN expense_categories c ON e.category_id = c.id
                    WHERE e.user_id = :userId
                        AND DATE(e.start_date) <= :lastDate
                        AND (e.end_date IS NULL OR e.end_date >= :firstDate)
                        AND (
                            DATE(e.next_due_date) BETWEEN :firstDateCopy AND :lastDateCopy
                            OR e.recurrence_rate IN ('daily', 'weekly', 'monthly', 'yearly')
                        )
                  ";
        var parameters = new Dictionary<string, object?>()
        {
            { ":userId", userId },
            { ":firstDate", firstDate.ToString("yyyy-MM-dd") },
            { ":lastDate", lastDate.ToString("yyyy-MM-dd") },
            { ":firstDateCopy", firstDate.ToString("yyyy-MM-dd") },
            { ":lastDateCopy", lastDate.ToString("yyyy-MM-dd") }
        };

        var dataTable = await _dbService.QueryAsync(sql, parameters).ConfigureAwait(false);

        return dataTable.MapList(row => new ExpenseDto
        {
            Id = row.Field<int>("id"),
            Name = row.Field<string>("name") ?? "Unknown Expense",
            Cost = row.Field<double>("cost"),
            Description = row.Field<string?>("description"),
            RecurrenceRate = row.Field<string>("recurrence_rate") ?? "once",
            LastCost = row.Field<double?>("last_cost"),
            CostUpdatedAt = row.Field<DateTime?>("cost_updated_at")?.ToString("yyyy-MM-dd"),
            CreatedAt = row.Field<DateTime>("created_at").ToString("yyyy-MM-dd"),
            UpdatedAt = row.Field<DateTime>("updated_at").ToString("yyyy-MM-dd"),
            NextDueDate = row.Field<DateTime?>("next_due_date")?.ToString("yyyy-MM-dd"),
            Active = row.Field<bool>("active"),
            StartDate = row.Field<DateTime>("start_date")!.ToString("yyyy-MM-dd"),
            EndDate = row.Field<string?>("end_date"),
            CategoryId = row.Field<int?>("category_id"),
            DueEndOfMonth = row.Field<bool>("due_end_of_month"),
            IsLate = row.Field<bool>("is_late"),
            CategoryName = row.Field<string>("category_name")
        });
    }

    public async Task<List<ExpenseDto>> GetAllExpensesAsync(int userId, string sortColumn, string sortDir, string? searchColumn, string? searchValue, bool showInactive)
    {
        var parameters = new Dictionary<string, object?>()
        {
            { "@userId", userId }
        };

        var sort = sortColumn == "category" ? "c.name" : $"e.{sortColumn}";
        var sortDirection = sortDir.ToLower() == "asc" ? "ASC" : "DESC";

        var selectFrom = "SELECT e.*, c.name as category_name FROM expenses e";

        var join = " LEFT JOIN expense_categories c ON e.category_id = c.id ";

        var where = " WHERE e.user_id = @userId";

        if (!showInactive)
            where += " AND e.active = 1";

        // Column searching
        if (!string.IsNullOrEmpty(searchColumn) && !string.IsNullOrEmpty(searchValue))
        {
            // TODO: sanitize search value to prevent
            var searchCol = searchColumn == "category" ? "c.name" : "e." + searchColumn;
            where += $" AND {searchCol} LIKE @searchValue";

            var escapedSearchValue = searchValue.Replace("%", "\\%").Replace("_", "\\_");
            parameters["@searchValue"] = $"%{escapedSearchValue}%";
        }

        var orderBy = $" ORDER BY {sort} {sortDir}, e.id DESC";

        var sql = selectFrom + join + where + orderBy;

        var dataTable = await _dbService.QueryAsync(sql, parameters).ConfigureAwait(false);

        return dataTable.MapList(row => new ExpenseDto
        {
            Id = row.Field<int>("id"),
            Name = row.Field<string>("name") ?? "Unknown Expense",
            Cost = row.Field<double>("cost"),
            Description = row.Field<string?>("description"),
            RecurrenceRate = row.Field<string>("recurrence_rate") ?? "once",
            LastCost = row.Field<double?>("last_cost"),
            CostUpdatedAt = row.Field<DateTime?>("cost_updated_at")?.ToString("yyyy-MM-dd"),
            CreatedAt = row.Field<DateTime>("created_at").ToString("yyyy-MM-dd"),
            UpdatedAt = row.Field<DateTime>("updated_at").ToString("yyyy-MM-dd"),
            NextDueDate = row.Field<DateTime?>("next_due_date")?.ToString("yyyy-MM-dd"),
            Active = row.Field<bool>("active"),
            StartDate = row.Field<DateTime>("start_date")!.ToString("yyyy-MM-dd"),
            EndDate = row.Field<string?>("end_date"),
            CategoryId = row.Field<int?>("category_id"),
            CategoryName = row.Field<string>("category_name"),
            DueEndOfMonth = row.Field<bool>("due_end_of_month")
        });
    }

    public async Task<bool> DeleteExpenseAsync(int expenseId, int userId)
    {
        var sql = @"DELETE FROM expenses
                    WHERE id = @expenseId
                        AND user_id = @userId";
        var parameters = new Dictionary<string, object?>()
        {
            { "@expenseId", expenseId },
            { "@userId", userId }
        };
        
        var result = await _dbService.ExecuteAsync(sql, parameters).ConfigureAwait(false);
        
        return result.RowsAffected > 0;
    }

    public async Task<List<ExpenseDto>> GetLateExpensesAsync(int userId)
    {
        var dateNow = new DateOnly();
        var sql = @"SELECT e.*, c.name as category_name FROM expenses e
                    LEFT JOIN expense_categories c ON e.category_id = c.id
                    WHERE e.user_id = :userId
                        AND e.active = 1
                        AND DATE(e.next_due_date) < :dateNow
                  ";
        var parameters = new Dictionary<string, object?>()
        {
            { "@userId", userId },
            { "@dateNow", dateNow.ToString("yyyy-MM-dd") }
        };

        var dataTable = await _dbService.QueryAsync(sql, parameters).ConfigureAwait(false);

        return dataTable.MapList(row => new ExpenseDto
        {
            Id = row.Field<int>("id"),
            Name = row.Field<string>("name") ?? "Unknown Expense",
            Cost = row.Field<double>("cost"),
            Description = row.Field<string?>("description"),
            RecurrenceRate = row.Field<string>("recurrence_rate") ?? "once",
            LastCost = row.Field<double?>("last_cost"),
            CostUpdatedAt = row.Field<DateTime?>("cost_updated_at")?.ToString("yyyy-MM-dd"),
            CreatedAt = row.Field<DateTime>("created_at").ToString("yyyy-MM-dd"),
            UpdatedAt = row.Field<DateTime>("updated_at").ToString("yyyy-MM-dd"),
            NextDueDate = row.Field<DateTime?>("next_due_date")?.ToString("yyyy-MM-dd"),
            Active = row.Field<bool>("active"),
            StartDate = row.Field<DateTime>("start_date")!.ToString("yyyy-MM-dd"),
            EndDate = row.Field<string?>("end_date"),
            CategoryId = row.Field<int?>("category_id"),
            CategoryName = row.Field<string>("category_name"),
            DueEndOfMonth = row.Field<bool>("due_end_of_month")
        });
    }
}