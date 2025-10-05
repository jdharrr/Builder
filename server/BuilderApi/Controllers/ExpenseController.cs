using BuilderServices;
using Microsoft.AspNetCore.Mvc;

namespace BuilderApi.Controllers;

[ApiController]
[Route("api/expenses")]
public class ExpenseController : ControllerBase
{
    private readonly ExpenseService _service;

    public ExpenseController(ExpenseService service)
    {
        _service = service;
    }
}
