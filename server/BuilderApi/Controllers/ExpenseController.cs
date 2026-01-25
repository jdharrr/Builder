using BuilderRepositories;
using BuilderServices.ExpenseCategoryService;
using BuilderServices.ExpenseCategoryService.Request;
using BuilderServices.CreditCardService;
using BuilderServices.ExpensePaymentService;
using BuilderServices.ExpenseService;
using BuilderServices.ExpenseService.Enums;
using BuilderServices.ExpenseService.Requests;
using DatabaseServices.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.WebUtilities;

namespace BuilderApi.Controllers;

[ApiController]
[Route("api/expenses")]
[Authorize]
public class ExpenseController : ControllerBase
{
    private readonly ExpenseService _expenseService;

    private readonly ExpenseCategoryService _categoryService;

    private readonly ExpensePaymentService _paymentService;
    private readonly CreditCardService _creditCardService;

    private readonly List<string> _sortDirs = ["asc", "desc"];

    public ExpenseController(ExpenseService expenseService, ExpenseCategoryService categoryService, ExpensePaymentService paymentService, CreditCardService creditCardService)
    {
        _expenseService = expenseService;
        _categoryService = categoryService;
        _paymentService = paymentService;
        _creditCardService = creditCardService;
    }

    [HttpPost("create")]
    public async Task<IActionResult> CreateExpense([FromBody] CreateExpenseRequest request)
    {
        //TODO: Validate request
        if (request is { OneTimeExpenseIsCredit: true, OneTimeExpenseIsPaid: true })
            throw new GenericException("Cannot provide both credit and payment");
        
        if ((request.OneTimeExpenseIsCredit && request.OneTimeExpenseCreditCardId == null) 
            || (request.PayToNowIsCredit && request.PayToNowCreditCardId == null)
            || (request.IsAutomaticPayment && request.AutomaticPaymentCreditCardId == null))
            throw new GenericException("Must provide a credit card for payment");

        if ((request.OneTimeExpenseIsPaid || request.OneTimeExpenseIsCredit) &&
            request.OneTimeExpensePaymentDate == null)
            throw new GenericException("Must provide a payment date for expense");
        
        if (request.RecurrenceRate != "once" && (request.OneTimeExpenseIsCredit || request.OneTimeExpenseIsPaid))
            throw new GenericException("Payment requires a recurrence rate of once");

        if (request.RecurrenceRate == "once" && request.PayToNow)
            throw new GenericException("Pay to now cannot have recurrence rate of once");

        var expenseId = await _expenseService.CreateExpenseAsync(request).ConfigureAwait(false);

        if (request.OneTimeExpenseIsPaid || request.OneTimeExpenseIsCredit)
            await _paymentService
                .PayDueDateAsync((int)expenseId, request.StartDate, false, request.OneTimeExpenseCreditCardId, request.OneTimeExpensePaymentDate)
                .ConfigureAwait(false);

        if (request.OneTimeExpenseIsCredit)
            await _creditCardService.AddPaymentToCreditCardAsync(request.Cost, (int)request.OneTimeExpenseCreditCardId!)
                .ConfigureAwait(false);
        
        if (request.PayToNow)
            await _paymentService.PayAllOverdueDatesAsync((int)expenseId, request.PayToNowCreditCardId).ConfigureAwait(false);
        
        return Ok(new { ExpenseId = expenseId });
    }

    [HttpGet("dashboard/calendar")]
    public async Task<IActionResult> GetExpensesForDashboardCalendar([FromQuery] GetExpensesForDashboardCalendarRequest request)
    {
        // TODO: Validate request

        var expenses = await _expenseService.GetExpensesForDashboardCalendarAsync(request.Year, request.Month).ConfigureAwait(false);

        return Ok(expenses);
    }

    [HttpGet("dashboard/upcoming")]
    public async Task<IActionResult> GetUpcomingExpenses()
    {
        var expenses = await _expenseService.GetUpcomingExpensesAsync().ConfigureAwait(false);

        return Ok(expenses);
    }

    [HttpGet("all")]
    public async Task<IActionResult> GetAllExpensesForTable([FromQuery] GetAllExpensesRequest request)
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

        var expenses = await _expenseService.GetAllExpensesForTableAsync(((ExpenseSortOption)sortOption!).GetColumnName(), request.SortDir, ((ExpenseSearchColumn?)searchColumn)?.GetColumnName(), request.SearchValue, request.ShowInactiveExpenses).ConfigureAwait(false);

        return Ok(expenses);
    }

    [HttpDelete("{id:int}/delete")]
    public async Task<IActionResult> DeleteExpense(int id)
    {
        await _expenseService.DeleteExpenseAsync(id).ConfigureAwait(false);
        
        return Ok();
    }

    [HttpGet("late")]
    public async Task<IActionResult> GetLateExpenses()
    {
        var expenses = await _expenseService.GetLateExpensesAsync().ConfigureAwait(false);
        
        return Ok(expenses);
    }

    [HttpGet("{id:int}/lateDates")]
    public async Task<IActionResult> GetLateDatesForExpense(int id)
    {
        var lateDates = await _expenseService.GetLateDatesForExpense(id).ConfigureAwait(false);

        return Ok(lateDates);
    }

    //expense updates
    [HttpPatch("update/{id:int}")]
    public async Task<IActionResult> UpdateExpense([FromBody] UpdateExpenseRequest request, int id)
    {
        int? isActive = null;
        if (request.Active != null)
            isActive = (bool)request.Active ? 1 : 0;

        int? isAutomaticPayments = null;
        if (request.AutomaticPayments != null)
            isAutomaticPayments = (bool)request.AutomaticPayments ? 1 : 0;
            
        await _expenseService.UpdateExpenseAsync(
            id,
            request.Name, 
            request.Cost,
            request.EndDate,
            request.CategoryId, 
            request.Description, 
            isActive, 
            isAutomaticPayments, 
            request.AutomaticPaymentsCreditCardId
        ).ConfigureAwait(false);

        return Ok();
    }
    
    [HttpPatch("update/batch/category")]
    public async Task<IActionResult> CategoryBatchUpdate([FromBody] CategoryBatchUpdateRequest request)
    {
        await _categoryService.CategoryBatchUpdateAsync(request.ExpenseIds, request.CategoryId).ConfigureAwait(false);

        return Ok();
    }
    
    //categories
    [HttpGet("categories")]
    public async Task<IActionResult> GetExpenseCategories([FromQuery] bool active)
    {
        var categories = await _categoryService.GetExpenseCategoriesAsync(active).ConfigureAwait(false);

        return Ok(categories);
    }
    
    [HttpPost("categories/create")]
    public async Task<IActionResult> CreateExpenseCategory([FromBody] CreateExpenseCategoryRequest request)
    {
        // TODO: validate request

        await _categoryService.CreateExpenseCategoryAsync(request.CategoryName).ConfigureAwait(false);

        return Ok();
    }

    [HttpPatch("categories/{id:int}/update/active")]
    public async Task<IActionResult> SetExpenseCategoryActiveStatus([FromBody] bool active, int id)
    {
        await _categoryService.SetExpenseCategoryActiveStatusAsync(id, active).ConfigureAwait(false);

        return Ok();
    }
    
    [HttpGet("categories/totalSpent")]
    public async Task<IActionResult> GetCategoryTotalSpentByRangeAsync([FromQuery] string rangeOption)
    {
        var categories = await _paymentService.GetCategoryTotalSpentByRangeAsync(rangeOption).ConfigureAwait(false);

        return Ok(categories);
    }

    [HttpGet("categories/chart/rangeOptions")]
    public IActionResult GetCategoryChartRangeOptions()
    {
        var options = ExpenseCategoryService.GetCategoryChartRangeOptions();

        return Ok(options);
    }

    [HttpPatch("categories/update/name")]
    public async Task<IActionResult> UpdateCategoryName(UpdateCategoryNameRequest request)
    {
        await _categoryService.UpdateCategoryNameAsync(request.CategoryId, request.NewCategoryName).ConfigureAwait(false);

        return Ok();
    }

    [HttpDelete("categories/{id:int}/delete")]
    public async Task<IActionResult> DeleteExpenseCategory(int id)
    {
        await _categoryService.DeleteExpenseCategoryAsync(id).ConfigureAwait(false);

        return Ok();
    }
    
    //expense table
    [HttpGet("table/options/sort")]
    public IActionResult GetSortOptions()
    {
        var options = ExpenseService.GetSortOptions();

        return Ok(options);
    }

    [HttpGet("table/options/searchableColumns")]
    public IActionResult GetSearchableColumns()
    {
        var columns = ExpenseService.GetSearchColumns();

        return Ok(columns);
    }
    
    [HttpGet("table/options/batchActions")]
    public IActionResult GetExpenseTableBatchActions()
    {
        var actions = ExpenseService.GetExpenseTableBatchActions();

        return Ok(actions);
    }
}
