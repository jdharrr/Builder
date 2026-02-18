using BuilderServices;
using BuilderServices.ExpenseCategories.ExpenseCategoryService;
using BuilderServices.ExpenseCategories.ExpenseCategoryService.Responses;
using BuilderServices.ExpenseCategories.ExpenseCategoryChartService;
using BuilderServices.ExpenseCategories.ExpenseCategoryChartService.Requests;
using BuilderServices.ExpenseCategories.ExpenseCategoryService.Requests;
using BuilderServices.Requests;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BuilderApi.Controllers.ExpenseCategories;

[ApiController]
[Route("api/expenses/categories")]
[Authorize]
public class CategoryController(
    ExpenseCategoryService categoryService,
    ExpenseCategoryChartService categoryChartService,
    ValidatorService validatorService
) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetExpenseCategories([FromQuery] GetExpenseCategoriesRequest request)
    {
        var validationResult = await validatorService.ValidateAsync(request);
        if (!validationResult.IsValid)
            return BadRequest(validationResult.Errors);
        
        var categories = await categoryService.GetExpenseCategoriesAsync(request.Active).ConfigureAwait(false);

        return Ok(categories);
    }

    [HttpPost("create")]
    public async Task<IActionResult> CreateExpenseCategory([FromBody] CreateExpenseCategoryRequest request)
    {
        var validationResult = await validatorService.ValidateAsync(request);
        if (!validationResult.IsValid)
            return BadRequest(validationResult.Errors);

        var isCreated = await categoryService.CreateExpenseCategoryAsync(request.CategoryName).ConfigureAwait(false);

        return Ok(new CreateExpenseCategoryResponse
        {
            IsCreated = isCreated
        });
    }

    [HttpPatch("{id:int}/update/active")]
    public async Task<IActionResult> SetExpenseCategoryActiveStatus([FromRoute] IdRequest routeRequest, [FromBody] SetExpenseCategoryActiveStatusRequest request)
    {
        var routeValidation = await validatorService.ValidateAsync(routeRequest);
        if (!routeValidation.IsValid)
            return BadRequest(routeValidation.Errors);

        var validationResult = await validatorService.ValidateAsync(request);
        if (!validationResult.IsValid)
            return BadRequest(validationResult.Errors);
        
        await categoryService.SetExpenseCategoryActiveStatusAsync(routeRequest.Id, request.Active).ConfigureAwait(false);

        return Ok(new SetExpenseCategoryActiveStatusResponse
        {
            IsUpdated = true
        });
    }

    [HttpGet("totalSpent")]
    public async Task<IActionResult> GetCategoryTotalSpentByRangeAsync([FromQuery] CategoryTotalSpentRequest request)
    {
        var validationResult = await validatorService.ValidateAsync(request);
        if (!validationResult.IsValid)
            return BadRequest(validationResult.Errors);
        
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
        var validationResult = await validatorService.ValidateAsync(request);
        if (!validationResult.IsValid)
            return BadRequest(validationResult.Errors);
        
        await categoryService.UpdateCategoryNameAsync(request.CategoryId, request.NewCategoryName).ConfigureAwait(false);

        return Ok(new UpdateCategoryNameResponse
        {
            IsUpdated = true
        });
    }

    [HttpDelete("{id:int}/delete")]
    public async Task<IActionResult> DeleteExpenseCategory([FromRoute] IdRequest request)
    {
        var validationResult = await validatorService.ValidateAsync(request);
        if (!validationResult.IsValid)
            return BadRequest(validationResult.Errors);
        
        await categoryService.DeleteExpenseCategoryAsync(request.Id).ConfigureAwait(false);

        return Ok(new DeleteExpenseCategoryResponse
        {
            IsDeleted = true
        });
    }

    [HttpGet("avg")]
    public async Task<IActionResult> GetAvgSpentForCategories([FromQuery] CategoryAvgSpentRequest request)
    {
        var validationResult = await validatorService.ValidateAsync(request);
        if (!validationResult.IsValid)
            return BadRequest(validationResult.Errors);
        
        var result = await categoryChartService.GetAvgSpentForCategoriesAsync(request.Year).ConfigureAwait(false);

        return Ok(result);
    }
}
