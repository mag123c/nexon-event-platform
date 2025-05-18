export interface BasePaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface MongooseQueryOptions {
  skip: number;
  limit: number;
  sort: { [key: string]: 1 | -1 };
}

export function getMongooseQueryOptions(
  pagination: BasePaginationOptions,
  defaultSortField: string = 'createdAt',
  defaultSortOrder: 'asc' | 'desc' = 'desc',
): MongooseQueryOptions {
  const page = pagination.page && pagination.page > 0 ? pagination.page : 1;
  const limit =
    pagination.limit && pagination.limit > 0 ? pagination.limit : 10;
  const skip = (page - 1) * limit;

  const sort: { [key: string]: 1 | -1 } = {};
  if (pagination.sortBy) {
    sort[pagination.sortBy] = pagination.sortOrder === 'desc' ? -1 : 1;
  } else {
    sort[defaultSortField] = defaultSortOrder === 'desc' ? -1 : 1;
  }

  return { skip, limit, sort };
}
