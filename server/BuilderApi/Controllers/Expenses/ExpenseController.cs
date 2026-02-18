using BuilderServices.ExpensePayments.ExpensePaymentService;
using BuilderServices.Expenses.ExpenseService;
using BuilderServices.Expenses.ExpenseService.Requests;
using BuilderServices.Expenses.ExpenseService.Responses;
using BuilderServices.Expenses.ExpenseTableService;
using BuilderServices.Expenses.ExpenseTableService.Enums;
using BuilderServices.Expenses.ExpenseTableService.Requests;
using BuilderServices.Expenses.ExpenseTableService.Responses;
using BuilderRepositories.Requests;
using BuilderServices.ExpenseCategories.ExpenseCategoryService;
using BuilderServices.ExpenseCategories.ExpenseCategoryService.Responses;
using BuilderServices;
using BuilderServices.Expenses.ExpenseCreationService;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BuilderApi.Controllers.Expenses;

[ApiController]
[Route("api/expenses")]
[Authorize]
public class ExpenseController(
    ExpenseService expenseService,
    ExpenseCreationService expenseCreationService,
    ExpenseTableService expenseTableService,
    ExpenseCategoryService categoryService,
    ValidatorService validatorService
) : ControllerBase
{
    private readonly List<string> _sortDirs = ["asc", "desc"];

    [HttpPost("create")]
    public async Task<IActionResult> CreateExpense([FromBody] CreateExpenseRequest request)
    {
        var validationResult = await validatorService.ValidateAsync(request);
        if (!validationResult.IsValid)
            return BadRequest(validationResult.Errors);

        return Ok(await expenseCreationService.CreateExpenseAsync(request).ConfigureAwait(false));
    }

    [HttpGet("dashboard/calendar")]
    public async Task<IActionResult> GetExpensesForDashboardCalendar([FromQuery] GetExpensesForDashboardCalendarRequest request)
    {
        var validationResult = await validatorService.ValidateAsync(request);
        if (!validationResult.IsValid)
            return BadRequest(validationResult.Errors);

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
        var validationResult = await validatorService.ValidateAsync(request);
        if (!validationResult.IsValid)
            return BadRequest(validationResult.Errors);

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

        var expenses = await expenseTableService.GetAllExpensesForTableAsync(request.Sort.GetColumnName(), request.SortDir, request.SearchColumn?.GetColumnName(), request.SearchValue, request.ShowInactiveExpenses, filters).ConfigureAwait(false);

        return Ok(expenses);
    }

    [HttpDelete("{id:int}/delete")]
    public async Task<IActionResult> DeleteExpense(int id)
    {
        if (id <= 0)
            return BadRequest("Expense id must be greater than 0");
        
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
        if (id <= 0)
            return BadRequest("Expense id must be greater than 0");
        
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
        var validationResult = await validatorService.ValidateAsync(request);
        if (!validationResult.IsValid)
            return BadRequest(validationResult.Errors);

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
        var validationResult = await validatorService.ValidateAsync(request);
        if (!validationResult.IsValid)
            return BadRequest(validationResult.Errors);

        await categoryService.CategoryBatchUpdateAsync(request.ExpenseIds, request.CategoryId).ConfigureAwait(false);

        return Ok(new CategoryBatchUpdateResponse
        {
            IsUpdated = true
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
