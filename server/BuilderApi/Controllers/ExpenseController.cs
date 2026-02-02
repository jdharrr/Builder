using BuilderRepositories;
using BuilderServices.ExpenseCategoryService;
using BuilderServices.ExpenseCategoryService.Request;
using BuilderServices.CreditCardService;
using BuilderServices.ExpensePayments.ExpensePaymentService;
using BuilderServices.ExpensePayments.ExpensePaymentService.Requests;
using BuilderServices.Expenses.ExpenseService;
using BuilderServices.Expenses.ExpenseService.Requests;
using BuilderServices.Expenses.ExpenseService.Responses;
using BuilderServices.Expenses.ExpenseTableService;
using BuilderServices.Expenses.ExpenseTableService.Enums;
using BuilderServices.Expenses.ExpenseTableService.Requests;
using BuilderServices.Expenses.ExpenseTableService.Responses;
using BuilderServices.ExpenseCategoryService.Responses;
using BuilderRepositories.Requests;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BuilderApi.Controllers;

[ApiController]
[Route("api/expenses")]
[Authorize]
public class ExpenseController(
    ExpenseService expenseService,
    ExpenseTableService expenseTableService,
    ExpenseCategoryService categoryService,
    ExpensePaymentService paymentService,
    CreditCardService creditCardService
) : ControllerBase
{
    private readonly List<string> _sortDirs = ["asc", "desc"];

    [HttpPost("create")]
    public async Task<IActionResult> CreateExpense([FromBody] CreateExpenseRequest request)
    {
        var oneTimePayment = request.OneTimePayment;
        var payToNowPayment = request.PayToNowPayment;
        var automaticPayment = request.AutomaticPayment;
        var hasOneTimePayment = oneTimePayment.IsPaid || oneTimePayment.IsCredit;

        if (oneTimePayment is { IsCredit: true, IsPaid: true })
            throw new GenericException("Cannot provide both credit and payment");
        
        if (oneTimePayment is { IsCredit: true, CreditCardId: null } 
            || payToNowPayment is { Enabled: true, IsCredit: true, CreditCardId: null } 
            || automaticPayment is { Enabled: true, CreditCardId: null })
            throw new GenericException("Must provide a credit card for payment");

        if (hasOneTimePayment && string.IsNullOrWhiteSpace(oneTimePayment.PaymentDate))
            throw new GenericException("Must provide a payment date for expense");
        
        if (request.RecurrenceRate != "once" && hasOneTimePayment)
            throw new GenericException("Payment requires a recurrence rate of once");

        if (request.RecurrenceRate == "once" && payToNowPayment.Enabled)
            throw new GenericException("Pay to now cannot have recurrence rate of once");

        var expenseId = await expenseService.CreateExpenseAsync(request).ConfigureAwait(false);

        if (hasOneTimePayment && !automaticPayment.Enabled)
            await paymentService
                .PayDueDateAsync((int)expenseId, request.StartDate, false, oneTimePayment.CreditCardId, oneTimePayment.PaymentDate)
                .ConfigureAwait(false);
        
        if (payToNowPayment.Enabled)
            await paymentService.PayAllOverdueDatesAsync((int)expenseId, payToNowPayment.CreditCardId).ConfigureAwait(false);
        
        return Ok(new CreateExpenseResponse
        {
            IsCreated = expenseId > 0
        });
    }

    [HttpGet("dashboard/calendar")]
    public async Task<IActionResult> GetExpensesForDashboardCalendar([FromQuery] GetExpensesForDashboardCalendarRequest request)
    {
        // TODO: Validate request

        var expenses = await expenseService.GetExpensesForDashboardCalendarAsync(request.Year, request.Month).ConfigureAwait(false);

        return Ok(expenses);
    }

    [HttpGet("dashboard/upcoming")]
    public async Task<IActionResult> GetUpcomingExpenses()
    {
        var expenses = await expenseService.GetUpcomingExpensesAsync().ConfigureAwait(false);

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

        List<TableFilter> filters = [];
        if (request.Filters.Count > 0)
        {
            foreach (var filter in request.Filters)
            {
                if (!Enum.TryParse(typeof(ExpenseTableFilterOption), filter.Filter, true, out var filterEnum))
                    return BadRequest("Invalid filter.");

                filters.Add(new TableFilter
                {
                    FilterType = ((ExpenseTableFilterOption)filterEnum).GetFilterType(),
                    FilterColumn = ((ExpenseTableFilterOption)filterEnum).GetFilterColumn(),
                    Value1 = filter.Value1,
                    Value2 = filter.Value2
                });
            }
        }

        var expenses = await expenseTableService.GetAllExpensesForTableAsync(((ExpenseSortOption)sortOption!).GetColumnName(), request.SortDir, ((ExpenseSearchColumn?)searchColumn)?.GetColumnName(), request.SearchValue, request.ShowInactiveExpenses, filters).ConfigureAwait(false);

        return Ok(expenses);
    }

    [HttpDelete("{id:int}/delete")]
    public async Task<IActionResult> DeleteExpense(int id)
    {
        await expenseService.DeleteExpenseAsync(id).ConfigureAwait(false);
        
        return Ok(new DeleteExpenseResponse
        {
            IsDeleted = true
        });
    }

    [HttpGet("late")]
    public async Task<IActionResult> GetLateExpenses()
    {
        var expenses = await expenseService.GetLateExpensesAsync().ConfigureAwait(false);
        
        return Ok(expenses);
    }

    [HttpGet("{id:int}/lateDates")]
    public async Task<IActionResult> GetLateDatesForExpense(int id)
    {
        var lateDates = await expenseService.GetLateDatesForExpense(id).ConfigureAwait(false);

        return Ok(new ExpenseLateDatesResponse
        {
            LateDates = lateDates
        });
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
            
        await expenseService.UpdateExpenseAsync(
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

        return Ok(new UpdateExpenseResponse
        {
            IsUpdated = true
        });
    }
    
    [HttpPatch("update/batch/category")]
    public async Task<IActionResult> CategoryBatchUpdate([FromBody] CategoryBatchUpdateRequest request)
    {
        await categoryService.CategoryBatchUpdateAsync(request.ExpenseIds, request.CategoryId).ConfigureAwait(false);

        return Ok(new CategoryBatchUpdateResponse
        {
            IsUpdated = true
        });
    }
    
    //categories
    [HttpGet("categories")]
    public async Task<IActionResult> GetExpenseCategories([FromQuery] GetExpenseCategoriesRequest request)
    {
        var categories = await categoryService.GetExpenseCategoriesAsync(request.Active).ConfigureAwait(false);

        return Ok(categories);
    }
    
    [HttpPost("categories/create")]
    public async Task<IActionResult> CreateExpenseCategory([FromBody] CreateExpenseCategoryRequest request)
    {
        // TODO: validate request

        var isCreated = await categoryService.CreateExpenseCategoryAsync(request.CategoryName).ConfigureAwait(false);

        return Ok(new CreateExpenseCategoryResponse
        {
            IsCreated = isCreated
        });
    }

    [HttpPatch("categories/{id:int}/update/active")]
    public async Task<IActionResult> SetExpenseCategoryActiveStatus([FromBody] SetExpenseCategoryActiveStatusRequest request, int id)
    {
        await categoryService.SetExpenseCategoryActiveStatusAsync(id, request.Active).ConfigureAwait(false);

        return Ok(new SetExpenseCategoryActiveStatusResponse
        {
            IsUpdated = true
        });
    }
    
    [HttpGet("categories/totalSpent")]
    public async Task<IActionResult> GetCategoryTotalSpentByRangeAsync([FromQuery] CategoryTotalSpentRequest request)
    {
        var categories = await paymentService.GetCategoryTotalSpentByRangeAsync(request.RangeOption).ConfigureAwait(false);

        return Ok(categories);
    }

    [HttpGet("categories/chart/rangeOptions")]
    public IActionResult GetCategoryChartRangeOptions()
    {
        var options = ExpenseCategoryService.GetCategoryChartRangeOptions();

        return Ok(new CategoryChartRangeOptionsResponse
        {
            RangeOptions = options
        });
    }

    [HttpPatch("categories/update/name")]
    public async Task<IActionResult> UpdateCategoryName(UpdateCategoryNameRequest request)
    {
        await categoryService.UpdateCategoryNameAsync(request.CategoryId, request.NewCategoryName).ConfigureAwait(false);

        return Ok(new UpdateCategoryNameResponse
        {
            IsUpdated = true
        });
    }

    [HttpDelete("categories/{id:int}/delete")]
    public async Task<IActionResult> DeleteExpenseCategory(int id)
    {
        await categoryService.DeleteExpenseCategoryAsync(id).ConfigureAwait(false);

        return Ok(new DeleteExpenseCategoryResponse
        {
            IsDeleted = true
        });
    }
    
    //expense table
    [HttpGet("table/options/sort")]
    public IActionResult GetSortOptions()
    {
        var options = ExpenseTableService.GetSortOptions();

        return Ok(new ExpenseTableSortOptionsResponse
        {
            SortOptions = options
        });
    }

    [HttpGet("table/options/searchableColumns")]
    public IActionResult GetSearchableColumns()
    {
        var columns = ExpenseTableService.GetSearchColumns();

        return Ok(new ExpenseTableSearchableColumnsResponse
        {
            SearchableColumns = columns
        });
    }
    
    [HttpGet("table/options/batchActions")]
    public IActionResult GetExpenseTableBatchActions()
    {
        var actions = ExpenseTableService.GetExpenseTableBatchActions();

        return Ok(new ExpenseTableBatchActionsResponse
        {
            BatchActions = actions
        });
    }

    [HttpGet("table/options/filters")]
    public IActionResult GetExpenseTableFilterOptions()
    {
        var filters = ExpenseTableService.GetExpenseTableFilterOptions();

        return Ok(new ExpenseTableFilterOptionsResponse
        {
            FilterOptions = filters
        });
    }
}
