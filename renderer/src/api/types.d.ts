export interface NestedArchivesRequest {
  requestId: string;
  archives: string[];
}

export interface NestedArchivesSelection {
  requestId: string;
  selected: string[]; // пустой массив значит пропустить
}
