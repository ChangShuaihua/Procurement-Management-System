export type OrgUnitRow = {
  id: string
  code: string
  name: string
  parent_id: string | null
  type: string
  address: string | null
  can_be_party_a: boolean
  status: string
}

export type OrgUnitInsert = {
  id: string
  code: string
  name: string
  parent_id: string | null
  type: string
  address: string | null
  can_be_party_a: boolean
  status: string
}

export interface Database {
  public: {
    Tables: {
      org_unit: {
        Row: OrgUnitRow
        Insert: OrgUnitInsert
        Update: Partial<OrgUnitInsert>
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
  }
}
