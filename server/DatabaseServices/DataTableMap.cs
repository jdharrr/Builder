using System.Data;

namespace DatabaseServices;

public static class DataTableMap
{
    public static T? MapSingle<T>(this DataTable? dt, Func<DataRow, T> map)
        => dt is null || dt.Rows.Count == 0 ? default : map(dt.Rows[0]);

    public static List<T>? MapList<T>(this DataTable? dt, Func<DataRow, T> map)
        => dt is null ? default : [.. dt.AsEnumerable().Select(map)];
}
