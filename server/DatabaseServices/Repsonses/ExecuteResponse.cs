using System.Data;

namespace DatabaseServices.Repsonses;

public class ExecuteResponse
{
    public required int RowsAffected { get; set; }

    public required long LastInsertedId { get; set; }
}
