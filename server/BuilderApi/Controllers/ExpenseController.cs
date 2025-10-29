using BuilderServices.ExpenseCategoryService;
using BuilderServices.ExpenseCategoryService.Request;
using BuilderServices.ExpenseService;
using BuilderServices.ExpenseService.Enums;
using BuilderServices.ExpenseService.Requests;
using DatabaseServices.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Org.BouncyCastle.Ocsp;
using System.Text.Json;

namespace BuilderApi.Controllers;

[ApiController]
[Route("api/expenses")]
[Authorize]
public class ExpenseController : ControllerBase
{
    private readonly ExpenseService _expenseService;

    private readonly ExpenseCategoryService _categoryService;

    private readonly List<string> _sortDirs = ["asc", "desc"];

    public ExpenseController(ExpenseService expenseService, ExpenseCategoryService categoryService)
    {
        _expenseService = expenseService;
        _categoryService = categoryService;
    }

    [HttpPost("createExpense")]
    public async Task<IActionResult> CreateExpense([FromBody] CreateExpenseRequest request)
    {
        //TODO: Validate request

        var expenseId = await _expenseService.CreateExpenseAsync(request).ConfigureAwait(false);

        return Ok(new { ExpenseId = expenseId });
    }

    [HttpGet("expensesForDashboardCalendar")]
    public async Task<IActionResult> GetExpensesForDashboardCalendar([FromQuery] GetExpensesForDashboardCalendarRequest request)
    {
        // TODO: Validate request

        var expenses = await _expenseService.GetExpensesForDashboardCalendarAsync(request.Year, request.Month).ConfigureAwait(false);

        return Ok(expenses);
    }

    [HttpGet("getUpcomingExpenses")]
    public async Task<IActionResult> GetUpcomingExpenses()
    {
        var expenses = await _expenseService.GetUpcomingExpensesAsync().ConfigureAwait(false);

        return Ok(expenses);
    }

    [HttpGet("getAllExpenses")]
    public async Task<IActionResult> GetAllExpenses([FromQuery] GetAllExpensesRequest request)
    {
        // TODO: Validate search request

        if (string.IsNullOrEmpty(request.Sort) || string.IsNullOrEmpty(request.SortDir))
            return BadRequest("Must provide sort column and sort direction.");

        if (!Enum.TryParse(typeof(ExpenseSortOption), request.Sort, true, out var sortOption))
            return BadRequest("Invalid sort option.");

        if (!_sortDirs.Contains(request.SortDir))
            return BadRequest("Invalid sort direction.");

        object? searchColumn = null;
        if (!string.IsNullOrEmpty(request.SearchColumn) && !Enum.TryParse(typeof(ExpenseSearchColumn), request.SearchColumn, true, out searchColumn))
            return BadRequest("Invalid search column.");

        var expenses = await _expenseService.GetAllExpensesAsync(((ExpenseSortOption)sortOption!).GetColumnName(), request.SortDir, ((ExpenseSearchColumn?)searchColumn)?.GetColumnName(), request.SearchValue, request.ShowInactiveExpenses).ConfigureAwait(false);

        return Ok(expenses);
    }

    [HttpPost("categories/create")]
    public async Task<IActionResult> CreateExpenseCategory([FromBody] CreateExpenseCategoryRequest request)
    {
        // TODO: validate request

        await _categoryService.CreateExpenseCategoryAsync(request.CategoryName).ConfigureAwait(false);

        return Ok();
    }

    [HttpGet("categories")]
    public async Task<IActionResult> GetExpenseCategories()
    {
        var categories = await _categoryService.GetExpenseCategoriesAsync().ConfigureAwait(false);

        return Ok(categories);
    }

    [HttpGet("table/sortOptions")]
    public IActionResult GetSortOptions()
    {
        var options = ExpenseService.GetSortOptions();

        return Ok(options);
    }

    [HttpGet("table/searchableColumns")]
    public IActionResult GetSearchableColumns()
    {
        var columns = ExpenseService.GetSearchColumns();

        return Ok(columns);
    }

    [HttpPatch("update/activeStatus")]
    public async Task<IActionResult> UpdateExpenseActiveStatus([FromBody] UpdateExpenseActiveStatusRequest request)
    {
        await _expenseService.UpdateExpenseActiveStatusAsync(request.ExpenseId, request.IsActive).ConfigureAwait(false);

        return Ok();
    }

    [HttpGet("expensePayments/paymentsForExpense")]
    public async Task<IActionResult> GetPaymentsForExpense([FromQuery] int expenseId)
    {
        var payments = await _expenseService.GetPaymentsForExpenseAsync(expenseId).ConfigureAwait(false);
        
        return Ok(payments);
    }

    [HttpDelete("deleteExpense")]
    public async Task<IActionResult> DeleteExpense([FromQuery] int expenseId)
    {
        await _expenseService.DeleteExpenseAsync(expenseId).ConfigureAwait(false);
        
        return Ok();
    }

    [HttpPatch("update/paidStatus")]
    public async Task<IActionResult> UpdateExpensePaidStatus([FromBody] UpdateExpensePaidStatusRequest request)
    {
        var dto = new ExpensePaymentDto
        {
            ExpenseId = request.ExpenseId,
            PaymentDate = request.DatePaid,
            DueDatePaid = request.DueDate
        };

        await _expenseService.UpdatePaymentForDueDateAsync(dto, request.IsPaid).ConfigureAwait(false);
        
        return Ok();
    }

    [HttpGet("lateExpenses")]
    public async Task<IActionResult> GetLateExpenses()
    {
        var expenses = await _expenseService.GetLateExpensesAsync().ConfigureAwait(false);
        
        return Ok(expenses);
    }

    [HttpGet("lateDatesForExpense")]
    public async Task<IActionResult> GetLateDatesForExpense([FromQuery] int expenseId)
    {
        var lateDates = await _expenseService.GetLateDatesForExpense(expenseId).ConfigureAwait(false);

        return Ok(lateDates);
    }

    [HttpGet("categories/categoriesTotalSpent")]
    public async Task<IActionResult> GetExpenseCategoriesWithTotalSpent([FromQuery] string rangeOption)
    {
        var categories = await _categoryService.GetExpenseCategoriesWithTotalSpentAsync(rangeOption).ConfigureAwait(false);

        return Ok(categories);
    }

    [HttpGet("categories/categoryChartRangeOptions")]
    public IActionResult GetCategoryChartRangeOptions()
    {
        var options = ExpenseCategoryService.GetCategoryChartRangeOptions();

        return Ok(options);
    }

    [HttpGet("table/getBatchActions")]
    public IActionResult GetExpenseTableBatchActions()
    {
        var actions = ExpenseService.GetExpenseTableBatchActions();

        return Ok(actions);
    }

    [HttpPatch("update/batchCategoryUpdate")]
    public async Task<IActionResult> CategoryBatchUpdate([FromBody] CategoryBatchUpdateRequest request)
    {
        await _categoryService.CategoryBatchUpdateAsync(request.ExpenseIds, request.CategoryId).ConfigureAwait(false);

        return Ok();
    }
}
