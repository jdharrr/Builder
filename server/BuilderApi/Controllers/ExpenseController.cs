using BuilderServices.ExpenseCategoryService;
using BuilderServices.ExpenseCategoryService.Request;
using BuilderServices.ExpensePaymentService;
using BuilderServices.ExpensePaymentService.Requests;
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

    private readonly ExpensePaymentService _paymentService;

    private readonly List<string> _sortDirs = ["asc", "desc"];

    public ExpenseController(ExpenseService expenseService, ExpenseCategoryService categoryService, ExpensePaymentService paymentService)
    {
        _expenseService = expenseService;
        _categoryService = categoryService;
        _paymentService = paymentService;
    }

    [HttpPost("createExpense")]
    public async Task<IActionResult> CreateExpense([FromBody] CreateExpenseRequest request)
    {
        //TODO: Validate request

        var expenseId = await _expenseService.CreateExpenseAsync(request).ConfigureAwait(false);

        if (request.PayToNow)
            await _paymentService.PayAllOverdueDatesAsync((int)expenseId).ConfigureAwait(false);
        
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

    [HttpDelete("deleteExpense")]
    public async Task<IActionResult> DeleteExpense([FromQuery] int expenseId)
    {
        await _expenseService.DeleteExpenseAsync(expenseId).ConfigureAwait(false);
        
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

    //expense updates
    [HttpPatch("update/expense")]
    public async Task<IActionResult> UpdateExpense([FromBody] UpdateExpenseRequest request)
    {
        int? isActive = null;
        if (request.Active != null)
            isActive = (bool)request.Active ? 1 : 0;
            
        await _expenseService.UpdateExpenseAsync(request.ExpenseId, request.Name, request.Cost, request.StartDate, request.EndDate, request.CategoryId, request.Description, isActive).ConfigureAwait(false);

        return Ok();
    }
    
    [HttpPatch("update/batchCategoryUpdate")]
    public async Task<IActionResult> CategoryBatchUpdate([FromBody] CategoryBatchUpdateRequest request)
    {
        await _categoryService.CategoryBatchUpdateAsync(request.ExpenseIds, request.CategoryId).ConfigureAwait(false);

        return Ok();
    }
    
    //payments
    [HttpGet("payments/totalSpent")]
    public async Task<IActionResult> GetTotalSpent()
    {
        var totalSpent = await _paymentService.GetTotalSpentAsync().ConfigureAwait(false);
        
        return Ok(totalSpent);
    }
    
    [HttpDelete("payments/unPayDueDates")]
    public async Task<IActionResult> UnpayDueDate([FromQuery] UnpayDueDatesRequest request)
    {
        await _paymentService.UnpayDueDateAsync(request.PaymentIds).ConfigureAwait(false);

        return Ok();
    }
    
    [HttpPost("payments/payAllOverdue/{expenseId}")]
    public async Task<IActionResult> PayAllOverdueDates(int expenseId)
    {
        await _paymentService.PayAllOverdueDatesAsync(expenseId).ConfigureAwait(false);

        return Ok();
    }
    
    [HttpPatch("payments/payDueDate")]
    public async Task<IActionResult> PayDueDate([FromBody] PayDueDateRequest request)
    {
        await _paymentService.PayDueDateAsync(request.ExpenseId, request.DueDate, request.DatePaid).ConfigureAwait(false);
        
        return Ok();
    }
    
    [HttpGet("payments/paymentsForExpense")]
    public async Task<IActionResult> GetPaymentsForExpense([FromQuery] int expenseId)
    {
        var payments = await _paymentService.GetPaymentsForExpenseAsync(expenseId).ConfigureAwait(false);
        
        return Ok(payments);
    }
    
    //categories
    [HttpGet("categories")]
    public async Task<IActionResult> GetExpenseCategories()
    {
        var categories = await _categoryService.GetExpenseCategoriesAsync().ConfigureAwait(false);

        return Ok(categories);
    }
    
    [HttpPost("categories/create")]
    public async Task<IActionResult> CreateExpenseCategory([FromBody] CreateExpenseCategoryRequest request)
    {
        // TODO: validate request

        await _categoryService.CreateExpenseCategoryAsync(request.CategoryName).ConfigureAwait(false);

        return Ok();
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
    
    //expense table
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
    
    [HttpGet("table/getBatchActions")]
    public IActionResult GetExpenseTableBatchActions()
    {
        var actions = ExpenseService.GetExpenseTableBatchActions();

        return Ok(actions);
    }
}
