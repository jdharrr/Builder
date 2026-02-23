using BuilderRepositories.Enums;
using BuilderRepositories.Requests;
using DatabaseServices;

namespace BuilderRepositories;

public class BuilderRepository
{
    private readonly DatabaseService _dbService;

    protected BuilderRepository(DatabaseService dbService) 
    { 
        _dbService = dbService;
    }

    public async Task BeginTransactionAsync()
    {
        await _dbService.BeginTransactionAsync().ConfigureAwait(false);
    }

    public async Task CommitTransactionAsync()
    {
        await _dbService.CommitAsync().ConfigureAwait(false);
    }

    public async Task RollbackTransactionAsync()
    {
        await _dbService.RollbackAsync().ConfigureAwait(false);
    }

    protected static string BuildInParams<T>(List<T> inList, ref Dictionary<string, object?> parameters, string? uniqueParamName = null)
    {
        var paramName = uniqueParamName is not null ? $"@{uniqueParamName}" : "@param";
        
        var sql = "";
        for (var i = 0; i < inList.Count; i++)
        {
            sql += $"{paramName}{i}";
            if (i < inList.Count - 1)
                sql += ",";

            parameters[$"{paramName}{i}"] = inList[i]; 
        }

        return sql;
    }
    
    protected static void AddTableFilters(ref string where, ref Dictionary<string, object?> parameters, List<TableFilter> filters)
    {
        if (filters.Count <= 0) return;

        var i = 0;
        foreach (var filter in filters)
        {
            if (string.IsNullOrEmpty(filter.Value1))
                continue;

            switch (filter.FilterType)
            {
                case TableFilterType.Text:
                    where += $" AND {filter.FilterColumn} LIKE @filterValue{i}";

                    var escapedFilterValue = filter.Value1.Replace("%", "\\%").Replace("_", "\\_");
                    parameters[$"@filterValue{i}"] = $"%{escapedFilterValue}%";
                    break;
                case TableFilterType.DateRange:
                    if (!DateOnly.TryParse(filter.Value1, out var _))
                        continue;

                    where += $" AND {filter.FilterColumn} >= @dateFrom{i}";
                    parameters[$"@dateFrom{i}"] = filter.Value1;

                    if (string.IsNullOrEmpty(filter.Value2) || !DateOnly.TryParse(filter.Value2, out var _))
                        break;

                    where += $" AND {filter.FilterColumn} <= @dateTo{i}";
                    parameters[$"@dateTo{i}"] = filter.Value2;
                    break;
                case TableFilterType.NumberRange:
                    if (!double.TryParse(filter.Value1, out var _))
                        continue;

                    where += $" AND {filter.FilterColumn} >= @numMin{i}";
                    parameters[$"@numMin{i}"] = filter.Value1;

                    if (string.IsNullOrEmpty(filter.Value2) || !double.TryParse(filter.Value2, out var _))
                        break;

                    where += $" AND {filter.FilterColumn} <= @numMax{i}";
                    parameters[$"@numMax{i}"] = filter.Value2;
                    break;
                case TableFilterType.MultiSelect:
                case TableFilterType.SingleSelect:
                    var values = filter.Value1.Split(",");
                    where += $" AND {filter.FilterColumn} IN ({BuildInParams(values.ToList(), ref parameters, filter.FilterColumn.Replace(".", ""))})";
                    break;
            }

            i++;
        }
    }
    
    protected static void AddTableSearch(ref string where, ref Dictionary<string, object?> parameters, string? searchColumn, string? searchValue)
    {
        if (string.IsNullOrEmpty(searchColumn) || string.IsNullOrEmpty(searchValue)) return;
        
        where += $" AND {searchColumn} LIKE @searchValue";

        var escapedSearchValue = searchValue.Replace("%", "\\%").Replace("_", "\\_");
        parameters["@searchValue"] = $"%{escapedSearchValue}%";
    }
    
    protected static string AddTableSort(string sortDir, string sortColumn, string tieBreakerAlias)
    {
        var sortDirection = sortDir.ToLower() == "asc" ? "ASC" : "DESC";

        return $" ORDER BY {sortColumn} {sortDirection}, {tieBreakerAlias}.id DESC";
    }
}
