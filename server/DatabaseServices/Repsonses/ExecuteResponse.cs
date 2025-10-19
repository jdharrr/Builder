using System.Data;

namespace DatabaseServices.Repsonses;

public class ExecuteResponse
{
    public int RowsAffected { get; set; } = 0;

    public long LastInsertedId { get; set; } = 0;
}
