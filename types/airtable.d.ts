declare module "airtable" {
  interface FieldSet {
    [key: string]: string | number | boolean | undefined;
  }

  interface Record<TFields extends FieldSet> {
    id: string;
    fields: TFields;
  }

  interface SelectOptions {
    view?: string;
    fields?: string[];
  }

  interface Table<TFields extends FieldSet> {
    select(options?: SelectOptions): Query<TFields>;
    update(
      recordId: string,
      fields: Partial<TFields>
    ): Promise<Record<TFields>>;
  }

  interface Query<TFields extends FieldSet> {
    eachPage(
      callback: (records: Record<TFields>[], fetchNextPage: () => void) => void
    ): Promise<void>;
  }

  interface Base {
    (tableName: string): Table<FieldSet>;
  }

  interface Airtable {
    configure(options: { apiKey: string; endpointUrl: string }): void;
    base(baseId: string): Base;
  }

  const Airtable: {
    new (): Airtable;
    configure(options: { apiKey: string; endpointUrl: string }): void;
    base(baseId: string): Base;
  };

  export = Airtable;
}
