using BuilderServices.ExpenseCategories.ExpenseCategoryService;
using BuilderServices.ExpenseCategories.ExpenseCategoryService.Request;
using BuilderServices.ExpenseCategories.ExpenseCategoryService.Responses;
using BuilderServices.ExpenseCategories.ExpenseCategoryChartService;
using BuilderServices.ExpenseCategories.ExpenseCategoryChartService.Requests;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BuilderApi.Controllers;

[ApiController]
[Route("api/expenses/categories")]
[Authorize]
public class CategoryController(
    ExpenseCategoryService categoryService,
    ExpenseCategoryChartService categoryChartService
) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetExpenseCategories([FromQuery] GetExpenseCategoriesRequest request)
    {
        var categories = await categoryService.GetExpenseCategoriesAsync(request.Active).ConfigureAwait(false);

        return Ok(categories);
    }

    [HttpPost("create")]
    public async Task<IActionResult> CreateExpenseCategory([FromBody] CreateExpenseCategoryRequest request)
    {
        // TODO: validate request

        var isCreated = await categoryService.CreateExpenseCategoryAsync(request.CategoryName).ConfigureAwait(false);

        return Ok(new CreateExpenseCategoryResponse
        {
            IsCreated = isCreated
        });
    }

    [HttpPatch("{id:int}/update/active")]
    public async Task<IActionResult> SetExpenseCategoryActiveStatus([FromBody] SetExpenseCategoryActiveStatusRequest request, int id)
    {
        await categoryService.SetExpenseCategoryActiveStatusAsync(id, request.Active).ConfigureAwait(false);

        return Ok(new SetExpenseCategoryActiveStatusResponse
        {
            IsUpdated = true
        });
    }

    [HttpGet("totalSpent")]
    public async Task<IActionResult> GetCategoryTotalSpentByRangeAsync([FromQuery] CategoryTotalSpentRequest request)
    {
        var categories = await categoryChartService.GetCategoryTotalSpentByRangeAsync(request.RangeOption).ConfigureAwait(false);

        return Ok(categories);
    }

    [HttpGet("chart/rangeOptions")]
    public IActionResult GetCategoryChartRangeOptions()
    {
        var options = ExpenseCategoryService.GetCategoryChartRangeOptions();

        return Ok(new CategoryChartRangeOptionsResponse
        {
            RangeOptions = options
        });
    }

    [HttpPatch("update/name")]
    public async Task<IActionResult> UpdateCategoryName(UpdateCategoryNameRequest request)
    {
        await categoryService.UpdateCategoryNameAsync(request.CategoryId, request.NewCategoryName).ConfigureAwait(false);

        return Ok(new UpdateCategoryNameResponse
        {
            IsUpdated = true
        });
    }

    [HttpDelete("{id:int}/delete")]
    public async Task<IActionResult> DeleteExpenseCategory(int id)
    {
        await categoryService.DeleteExpenseCategoryAsync(id).ConfigureAwait(false);

        return Ok(new DeleteExpenseCategoryResponse
        {
            IsDeleted = true
        });
    }

    [HttpGet("avg")]
    public async Task<IActionResult> GetAvgSpentForCategories([FromQuery] CategoryAvgSpentRequest? request)
    {
        var year = request?.Year ?? DateTime.Today.Year;
        if (year is < 1000 or > 9999)
        {
            return BadRequest("Invalid year.");
        }
        var result = await categoryChartService.GetAvgSpentForCategoriesAsync(year).ConfigureAwait(false);

        return Ok(result);
    }
}
