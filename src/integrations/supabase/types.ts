export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  _arch: {
    Tables: {
      menu: {
        Row: {
          createdby: string
          createddate: string
          displaymenuflag: boolean
          menudescription: string
          menuicon: string | null
          menuid: string
          menuname: string
          menuorder: number
          modifiedby: string
          modifieddate: string
          parentmenuid: string | null
          screenid: string | null
        }
        Insert: {
          createdby?: string
          createddate?: string
          displaymenuflag?: boolean
          menudescription: string
          menuicon?: string | null
          menuid?: string
          menuname: string
          menuorder: number
          modifiedby?: string
          modifieddate?: string
          parentmenuid?: string | null
          screenid?: string | null
        }
        Update: {
          createdby?: string
          createddate?: string
          displaymenuflag?: boolean
          menudescription?: string
          menuicon?: string | null
          menuid?: string
          menuname?: string
          menuorder?: number
          modifiedby?: string
          modifieddate?: string
          parentmenuid?: string | null
          screenid?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_menu_parentmenu"
            columns: ["parentmenuid"]
            isOneToOne: false
            referencedRelation: "menu"
            referencedColumns: ["menuid"]
          },
          {
            foreignKeyName: "fk_menu_screen"
            columns: ["screenid"]
            isOneToOne: false
            referencedRelation: "screen"
            referencedColumns: ["screenid"]
          },
        ]
      }
      messagecategory: {
        Row: {
          createdby: string
          createddate: string
          messagecategorycode: number
          messagecategorydescription: string | null
          messagecategoryid: string
          messagecategoryname: string
          modifiedby: string
          modifieddate: string
        }
        Insert: {
          createdby?: string
          createddate?: string
          messagecategorycode: number
          messagecategorydescription?: string | null
          messagecategoryid?: string
          messagecategoryname: string
          modifiedby?: string
          modifieddate?: string
        }
        Update: {
          createdby?: string
          createddate?: string
          messagecategorycode?: number
          messagecategorydescription?: string | null
          messagecategoryid?: string
          messagecategoryname?: string
          modifiedby?: string
          modifieddate?: string
        }
        Relationships: []
      }
      messagecode: {
        Row: {
          createdby: string
          createddate: string
          messagecategoryid: string
          messagecodeid: string
          messagecodevalue: number
          messagelongdescription: string
          messageshortdescription: string
          modifiedby: string
          modifieddate: string
          moduleid: string
        }
        Insert: {
          createdby?: string
          createddate?: string
          messagecategoryid: string
          messagecodeid?: string
          messagecodevalue: number
          messagelongdescription: string
          messageshortdescription: string
          modifiedby?: string
          modifieddate?: string
          moduleid: string
        }
        Update: {
          createdby?: string
          createddate?: string
          messagecategoryid?: string
          messagecodeid?: string
          messagecodevalue?: number
          messagelongdescription?: string
          messageshortdescription?: string
          modifiedby?: string
          modifieddate?: string
          moduleid?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_messagecode_messagecategory"
            columns: ["messagecategoryid"]
            isOneToOne: false
            referencedRelation: "messagecategory"
            referencedColumns: ["messagecategoryid"]
          },
          {
            foreignKeyName: "fk_messagecode_module"
            columns: ["moduleid"]
            isOneToOne: false
            referencedRelation: "module"
            referencedColumns: ["moduleid"]
          },
        ]
      }
      module: {
        Row: {
          applicationcode: string | null
          createdby: string
          createddate: string
          modifiedby: string
          modifieddate: string
          moduledescription: string | null
          moduleid: string
          modulename: string
          parentmoduleid: string | null
          sortorder: number
        }
        Insert: {
          applicationcode?: string | null
          createdby?: string
          createddate?: string
          modifiedby?: string
          modifieddate?: string
          moduledescription?: string | null
          moduleid?: string
          modulename: string
          parentmoduleid?: string | null
          sortorder: number
        }
        Update: {
          applicationcode?: string | null
          createdby?: string
          createddate?: string
          modifiedby?: string
          modifieddate?: string
          moduledescription?: string | null
          moduleid?: string
          modulename?: string
          parentmoduleid?: string | null
          sortorder?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_module_parentmodule"
            columns: ["parentmoduleid"]
            isOneToOne: false
            referencedRelation: "module"
            referencedColumns: ["moduleid"]
          },
        ]
      }
      number: {
        Row: {
          createdby: string
          createddate: string
          modifiedby: string
          modifieddate: string
          numberid: string
          numbervalue: number
        }
        Insert: {
          createdby?: string
          createddate?: string
          modifiedby?: string
          modifieddate?: string
          numberid?: string
          numbervalue: number
        }
        Update: {
          createdby?: string
          createddate?: string
          modifiedby?: string
          modifieddate?: string
          numberid?: string
          numbervalue?: number
        }
        Relationships: []
      }
      screen: {
        Row: {
          createdby: string
          createddate: string
          defaultnumberofrows: number | null
          isreport: boolean
          modifiedby: string
          modifieddate: string
          moduleid: string
          parentscreenid: string | null
          reportid: string | null
          screenconfiguration: Json
          screendescription: string | null
          screenid: string
          screenname: string
          screentags: string | null
          screentitle: string
          sortorder: number | null
          urladdress: string | null
        }
        Insert: {
          createdby?: string
          createddate?: string
          defaultnumberofrows?: number | null
          isreport?: boolean
          modifiedby?: string
          modifieddate?: string
          moduleid: string
          parentscreenid?: string | null
          reportid?: string | null
          screenconfiguration?: Json
          screendescription?: string | null
          screenid?: string
          screenname: string
          screentags?: string | null
          screentitle: string
          sortorder?: number | null
          urladdress?: string | null
        }
        Update: {
          createdby?: string
          createddate?: string
          defaultnumberofrows?: number | null
          isreport?: boolean
          modifiedby?: string
          modifieddate?: string
          moduleid?: string
          parentscreenid?: string | null
          reportid?: string | null
          screenconfiguration?: Json
          screendescription?: string | null
          screenid?: string
          screenname?: string
          screentags?: string | null
          screentitle?: string
          sortorder?: number | null
          urladdress?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_screen_module"
            columns: ["moduleid"]
            isOneToOne: false
            referencedRelation: "module"
            referencedColumns: ["moduleid"]
          },
          {
            foreignKeyName: "fk_screen_parentscreen"
            columns: ["parentscreenid"]
            isOneToOne: false
            referencedRelation: "screen"
            referencedColumns: ["screenid"]
          },
        ]
      }
      screenfunctionmap: {
        Row: {
          actiontype: string
          createdby: string
          createddate: string
          functionname: string
          modifiedby: string
          modifieddate: string
          screenfunctionmapid: string
          screenid: string
        }
        Insert: {
          actiontype: string
          createdby?: string
          createddate?: string
          functionname: string
          modifiedby?: string
          modifieddate?: string
          screenfunctionmapid?: string
          screenid: string
        }
        Update: {
          actiontype?: string
          createdby?: string
          createddate?: string
          functionname?: string
          modifiedby?: string
          modifieddate?: string
          screenfunctionmapid?: string
          screenid?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_screenfunctionmap_screen"
            columns: ["screenid"]
            isOneToOne: false
            referencedRelation: "screen"
            referencedColumns: ["screenid"]
          },
        ]
      }
      transactiontype: {
        Row: {
          createdby: string
          createddate: string
          modifiedby: string
          modifieddate: string
          moduleid: string
          processqueue: string | null
          transactiontypecode: string
          transactiontypedescription: string | null
          transactiontypeid: string
          transactiontypename: string
        }
        Insert: {
          createdby?: string
          createddate?: string
          modifiedby?: string
          modifieddate?: string
          moduleid: string
          processqueue?: string | null
          transactiontypecode: string
          transactiontypedescription?: string | null
          transactiontypeid?: string
          transactiontypename: string
        }
        Update: {
          createdby?: string
          createddate?: string
          modifiedby?: string
          modifieddate?: string
          moduleid?: string
          processqueue?: string | null
          transactiontypecode?: string
          transactiontypedescription?: string | null
          transactiontypeid?: string
          transactiontypename?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_transactiontype_module"
            columns: ["moduleid"]
            isOneToOne: false
            referencedRelation: "module"
            referencedColumns: ["moduleid"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_see_menu: { Args: { target_menuid: string }; Returns: boolean }
      is_arch_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  _batch: {
    Tables: {
      batchprocessqueue: {
        Row: {
          batchprocessqueueid: string
          createdby: string
          createddate: string
          isqueued: boolean
          modifiedby: string
          modifieddate: string
          transactionpayload: Json
          transactiontypeid: string
        }
        Insert: {
          batchprocessqueueid?: string
          createdby?: string
          createddate?: string
          isqueued?: boolean
          modifiedby?: string
          modifieddate?: string
          transactionpayload: Json
          transactiontypeid: string
        }
        Update: {
          batchprocessqueueid?: string
          createdby?: string
          createddate?: string
          isqueued?: boolean
          modifiedby?: string
          modifieddate?: string
          transactionpayload?: Json
          transactiontypeid?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_batch_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  _calendar: {
    Tables: {
      calendarevent: {
        Row: {
          calendareventid: string
          calendareventname: string
          calendartypeid: string
          createdby: string
          createddate: string
          eventenddatetime: string
          eventstartdatetime: string
          modifiedby: string
          modifieddate: string
          recurringeventid: string | null
        }
        Insert: {
          calendareventid?: string
          calendareventname: string
          calendartypeid: string
          createdby?: string
          createddate?: string
          eventenddatetime: string
          eventstartdatetime: string
          modifiedby?: string
          modifieddate?: string
          recurringeventid?: string | null
        }
        Update: {
          calendareventid?: string
          calendareventname?: string
          calendartypeid?: string
          createdby?: string
          createddate?: string
          eventenddatetime?: string
          eventstartdatetime?: string
          modifiedby?: string
          modifieddate?: string
          recurringeventid?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_calendarevent_calendartype"
            columns: ["calendartypeid"]
            isOneToOne: false
            referencedRelation: "calendartype"
            referencedColumns: ["calendartypeid"]
          },
          {
            foreignKeyName: "fk_calendarevent_recurringevent"
            columns: ["recurringeventid"]
            isOneToOne: false
            referencedRelation: "recurringevent"
            referencedColumns: ["recurringeventid"]
          },
        ]
      }
      calendartype: {
        Row: {
          calendarcolorcode: string | null
          calendartypeid: string
          calendartypename: string
          createdby: string
          createddate: string
          issystemcalendar: boolean
          modifiedby: string
          modifieddate: string
        }
        Insert: {
          calendarcolorcode?: string | null
          calendartypeid?: string
          calendartypename: string
          createdby?: string
          createddate?: string
          issystemcalendar?: boolean
          modifiedby?: string
          modifieddate?: string
        }
        Update: {
          calendarcolorcode?: string | null
          calendartypeid?: string
          calendartypename?: string
          createdby?: string
          createddate?: string
          issystemcalendar?: boolean
          modifiedby?: string
          modifieddate?: string
        }
        Relationships: []
      }
      nonstandardeventtype: {
        Row: {
          createdby: string
          createddate: string
          modifiedby: string
          modifieddate: string
          nonstandardeventtypecode: string
          nonstandardeventtypedetails: Json | null
          nonstandardeventtypeid: string
          nonstandardeventtypename: string
          organizationid: string
        }
        Insert: {
          createdby?: string
          createddate?: string
          modifiedby?: string
          modifieddate?: string
          nonstandardeventtypecode: string
          nonstandardeventtypedetails?: Json | null
          nonstandardeventtypeid?: string
          nonstandardeventtypename: string
          organizationid: string
        }
        Update: {
          createdby?: string
          createddate?: string
          modifiedby?: string
          modifieddate?: string
          nonstandardeventtypecode?: string
          nonstandardeventtypedetails?: Json | null
          nonstandardeventtypeid?: string
          nonstandardeventtypename?: string
          organizationid?: string
        }
        Relationships: []
      }
      organizationcalendartype: {
        Row: {
          calendartypeid: string
          createdby: string
          createddate: string
          modifiedby: string
          modifieddate: string
          organizationcalendartypeid: string
          organizationid: string
        }
        Insert: {
          calendartypeid: string
          createdby?: string
          createddate?: string
          modifiedby?: string
          modifieddate?: string
          organizationcalendartypeid?: string
          organizationid: string
        }
        Update: {
          calendartypeid?: string
          createdby?: string
          createddate?: string
          modifiedby?: string
          modifieddate?: string
          organizationcalendartypeid?: string
          organizationid?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_organizationcalendartype_calendartype"
            columns: ["calendartypeid"]
            isOneToOne: false
            referencedRelation: "calendartype"
            referencedColumns: ["calendartypeid"]
          },
        ]
      }
      recurringevent: {
        Row: {
          allowinlieu: boolean
          calendartypeid: string
          createdby: string
          createddate: string
          modifiedby: string
          modifieddate: string
          recurringeventcode: string
          recurringeventdate: string
          recurringeventdescription: string | null
          recurringeventid: string
          recurringfrequency: string
        }
        Insert: {
          allowinlieu?: boolean
          calendartypeid: string
          createdby?: string
          createddate?: string
          modifiedby?: string
          modifieddate?: string
          recurringeventcode: string
          recurringeventdate: string
          recurringeventdescription?: string | null
          recurringeventid?: string
          recurringfrequency?: string
        }
        Update: {
          allowinlieu?: boolean
          calendartypeid?: string
          createdby?: string
          createddate?: string
          modifiedby?: string
          modifieddate?: string
          recurringeventcode?: string
          recurringeventdate?: string
          recurringeventdescription?: string | null
          recurringeventid?: string
          recurringfrequency?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_recurringevent_calendartype"
            columns: ["calendartypeid"]
            isOneToOne: false
            referencedRelation: "calendartype"
            referencedColumns: ["calendartypeid"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_calendar_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  _common: {
    Tables: {
      attributedatatype: {
        Row: {
          attributedatatypecode: number
          attributedatatypeid: string
          attributedatatypename: string
          createdby: string
          createddate: string
          modifiedby: string
          modifieddate: string
        }
        Insert: {
          attributedatatypecode: number
          attributedatatypeid?: string
          attributedatatypename: string
          createdby?: string
          createddate?: string
          modifiedby?: string
          modifieddate?: string
        }
        Update: {
          attributedatatypecode?: number
          attributedatatypeid?: string
          attributedatatypename?: string
          createdby?: string
          createddate?: string
          modifiedby?: string
          modifieddate?: string
        }
        Relationships: []
      }
      country: {
        Row: {
          countrycode: string
          countryid: string
          countryname: string
          createdby: string
          createddate: string
          isdefault: boolean
          modifiedby: string
          modifieddate: string
        }
        Insert: {
          countrycode: string
          countryid?: string
          countryname: string
          createdby?: string
          createddate?: string
          isdefault?: boolean
          modifiedby?: string
          modifieddate?: string
        }
        Update: {
          countrycode?: string
          countryid?: string
          countryname?: string
          createdby?: string
          createddate?: string
          isdefault?: boolean
          modifiedby?: string
          modifieddate?: string
        }
        Relationships: []
      }
      countrydialcode: {
        Row: {
          countrydialcode: string
          countrydialid: string
          countryid: string
          createdby: string
          createddate: string
          modifiedby: string
          modifieddate: string
        }
        Insert: {
          countrydialcode: string
          countrydialid?: string
          countryid: string
          createdby?: string
          createddate?: string
          modifiedby?: string
          modifieddate?: string
        }
        Update: {
          countrydialcode?: string
          countrydialid?: string
          countryid?: string
          createdby?: string
          createddate?: string
          modifiedby?: string
          modifieddate?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_countrydialcode_country"
            columns: ["countryid"]
            isOneToOne: false
            referencedRelation: "country"
            referencedColumns: ["countryid"]
          },
        ]
      }
      currency: {
        Row: {
          createdby: string
          createddate: string
          currencycode: string
          currencyid: string
          currencylabel: string
          currencyname: string | null
          modifiedby: string
          modifieddate: string
        }
        Insert: {
          createdby?: string
          createddate?: string
          currencycode: string
          currencyid?: string
          currencylabel: string
          currencyname?: string | null
          modifiedby?: string
          modifieddate?: string
        }
        Update: {
          createdby?: string
          createddate?: string
          currencycode?: string
          currencyid?: string
          currencylabel?: string
          currencyname?: string | null
          modifiedby?: string
          modifieddate?: string
        }
        Relationships: []
      }
      dayofweek: {
        Row: {
          createdby: string
          createddate: string
          dayofweekcode: number
          dayofweekid: string
          dayofweekname: string
          dayofweekorder: number
          dayofweekshortname: string
          modifiedby: string
          modifieddate: string
        }
        Insert: {
          createdby?: string
          createddate?: string
          dayofweekcode: number
          dayofweekid?: string
          dayofweekname: string
          dayofweekorder: number
          dayofweekshortname: string
          modifiedby?: string
          modifieddate?: string
        }
        Update: {
          createdby?: string
          createddate?: string
          dayofweekcode?: number
          dayofweekid?: string
          dayofweekname?: string
          dayofweekorder?: number
          dayofweekshortname?: string
          modifiedby?: string
          modifieddate?: string
        }
        Relationships: []
      }
      monthdayordinal: {
        Row: {
          createdby: string
          createddate: string
          modifiedby: string
          modifieddate: string
          monthdayordinalcode: number
          monthdayordinalid: string
          monthdayordinalname: string | null
          monthdayordinalvalue: number
        }
        Insert: {
          createdby?: string
          createddate?: string
          modifiedby?: string
          modifieddate?: string
          monthdayordinalcode: number
          monthdayordinalid?: string
          monthdayordinalname?: string | null
          monthdayordinalvalue: number
        }
        Update: {
          createdby?: string
          createddate?: string
          modifiedby?: string
          modifieddate?: string
          monthdayordinalcode?: number
          monthdayordinalid?: string
          monthdayordinalname?: string | null
          monthdayordinalvalue?: number
        }
        Relationships: []
      }
      parameter: {
        Row: {
          createdby: string
          createddate: string
          donotdisplayplainflag: boolean
          enddatetime: string | null
          modifiedby: string
          modifieddate: string
          parameterdate: string | null
          parameterdescription: string | null
          parametergroupid: string
          parameterid: string
          parametername: string
          parameternumeric: number | null
          parametertext: string | null
          parametertype: string
          startdatetime: string
          systemparameterflag: boolean
        }
        Insert: {
          createdby?: string
          createddate?: string
          donotdisplayplainflag?: boolean
          enddatetime?: string | null
          modifiedby?: string
          modifieddate?: string
          parameterdate?: string | null
          parameterdescription?: string | null
          parametergroupid: string
          parameterid?: string
          parametername: string
          parameternumeric?: number | null
          parametertext?: string | null
          parametertype: string
          startdatetime: string
          systemparameterflag?: boolean
        }
        Update: {
          createdby?: string
          createddate?: string
          donotdisplayplainflag?: boolean
          enddatetime?: string | null
          modifiedby?: string
          modifieddate?: string
          parameterdate?: string | null
          parameterdescription?: string | null
          parametergroupid?: string
          parameterid?: string
          parametername?: string
          parameternumeric?: number | null
          parametertext?: string | null
          parametertype?: string
          startdatetime?: string
          systemparameterflag?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "fk_parameter_parametergroup"
            columns: ["parametergroupid"]
            isOneToOne: false
            referencedRelation: "parametergroup"
            referencedColumns: ["parametergroupid"]
          },
        ]
      }
      parametergroup: {
        Row: {
          createdby: string
          createddate: string
          modifiedby: string
          modifieddate: string
          parametergroupid: string
          parametergroupname: string
        }
        Insert: {
          createdby?: string
          createddate?: string
          modifiedby?: string
          modifieddate?: string
          parametergroupid?: string
          parametergroupname: string
        }
        Update: {
          createdby?: string
          createddate?: string
          modifiedby?: string
          modifieddate?: string
          parametergroupid?: string
          parametergroupname?: string
        }
        Relationships: []
      }
      referencedata: {
        Row: {
          active: boolean
          createdby: string
          createddate: string
          modifiedby: string
          modifieddate: string
          referencedatadescription: string | null
          referencedataid: string
          referencedataname: string
          referencedatatypeid: string | null
          referencedatavalue: string
          sortorder: number
        }
        Insert: {
          active?: boolean
          createdby?: string
          createddate?: string
          modifiedby?: string
          modifieddate?: string
          referencedatadescription?: string | null
          referencedataid?: string
          referencedataname: string
          referencedatatypeid?: string | null
          referencedatavalue: string
          sortorder?: number
        }
        Update: {
          active?: boolean
          createdby?: string
          createddate?: string
          modifiedby?: string
          modifieddate?: string
          referencedatadescription?: string | null
          referencedataid?: string
          referencedataname?: string
          referencedatatypeid?: string | null
          referencedatavalue?: string
          sortorder?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_referencedata_referencedatatype"
            columns: ["referencedatatypeid"]
            isOneToOne: false
            referencedRelation: "referencedatatype"
            referencedColumns: ["referencedatatypeid"]
          },
        ]
      }
      referencedatatype: {
        Row: {
          createdby: string
          createddate: string
          modifiedby: string
          modifieddate: string
          referencedatatypeid: string
          referencedatatypename: string
        }
        Insert: {
          createdby?: string
          createddate?: string
          modifiedby?: string
          modifieddate?: string
          referencedatatypeid?: string
          referencedatatypename: string
        }
        Update: {
          createdby?: string
          createddate?: string
          modifiedby?: string
          modifieddate?: string
          referencedatatypeid?: string
          referencedatatypename?: string
        }
        Relationships: []
      }
      reviewcategory: {
        Row: {
          createdby: string
          createddate: string
          modifiedby: string
          modifieddate: string
          reviewcategorycode: string
          reviewcategoryid: string
          reviewcategoryname: string
        }
        Insert: {
          createdby?: string
          createddate?: string
          modifiedby?: string
          modifieddate?: string
          reviewcategorycode: string
          reviewcategoryid?: string
          reviewcategoryname: string
        }
        Update: {
          createdby?: string
          createddate?: string
          modifiedby?: string
          modifieddate?: string
          reviewcategorycode?: string
          reviewcategoryid?: string
          reviewcategoryname?: string
        }
        Relationships: []
      }
      reviewstatus: {
        Row: {
          createdby: string
          createddate: string
          isapproval: boolean
          isrejection: boolean
          modifiedby: string
          modifieddate: string
          reviewcategoryid: string
          reviewstatuscode: number
          reviewstatusid: string
          reviewstatusname: string
          sortorder: number
          standardreviewstatusid: string | null
        }
        Insert: {
          createdby?: string
          createddate?: string
          isapproval?: boolean
          isrejection?: boolean
          modifiedby?: string
          modifieddate?: string
          reviewcategoryid: string
          reviewstatuscode: number
          reviewstatusid?: string
          reviewstatusname: string
          sortorder: number
          standardreviewstatusid?: string | null
        }
        Update: {
          createdby?: string
          createddate?: string
          isapproval?: boolean
          isrejection?: boolean
          modifiedby?: string
          modifieddate?: string
          reviewcategoryid?: string
          reviewstatuscode?: number
          reviewstatusid?: string
          reviewstatusname?: string
          sortorder?: number
          standardreviewstatusid?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_reviewstatus_reviewcategory"
            columns: ["reviewcategoryid"]
            isOneToOne: false
            referencedRelation: "reviewcategory"
            referencedColumns: ["reviewcategoryid"]
          },
          {
            foreignKeyName: "fk_reviewstatus_standardreviewstatus"
            columns: ["standardreviewstatusid"]
            isOneToOne: false
            referencedRelation: "standardreviewstatus"
            referencedColumns: ["standardreviewstatusid"]
          },
        ]
      }
      standardreviewstatus: {
        Row: {
          createdby: string
          createddate: string
          modifiedby: string
          modifieddate: string
          standardreviewstatuscode: string
          standardreviewstatusdescription: string
          standardreviewstatusid: string
        }
        Insert: {
          createdby?: string
          createddate?: string
          modifiedby?: string
          modifieddate?: string
          standardreviewstatuscode: string
          standardreviewstatusdescription: string
          standardreviewstatusid?: string
        }
        Update: {
          createdby?: string
          createddate?: string
          modifiedby?: string
          modifieddate?: string
          standardreviewstatuscode?: string
          standardreviewstatusdescription?: string
          standardreviewstatusid?: string
        }
        Relationships: []
      }
      taxapplicationrule: {
        Row: {
          createdby: string
          createddate: string
          modifiedby: string
          modifieddate: string
          taxapplicationrulecode: number
          taxapplicationruleid: string
          taxapplicationrulename: string
        }
        Insert: {
          createdby?: string
          createddate?: string
          modifiedby?: string
          modifieddate?: string
          taxapplicationrulecode: number
          taxapplicationruleid?: string
          taxapplicationrulename: string
        }
        Update: {
          createdby?: string
          createddate?: string
          modifiedby?: string
          modifieddate?: string
          taxapplicationrulecode?: number
          taxapplicationruleid?: string
          taxapplicationrulename?: string
        }
        Relationships: []
      }
      uom: {
        Row: {
          baseuomid: string | null
          createdby: string
          createddate: string
          defaultuomflag: boolean
          modifiedby: string
          modifieddate: string
          scaleorder: number | null
          uomcategoryid: string
          uomcode: number
          uomdescription: string
          uomid: string
          uomname: string
        }
        Insert: {
          baseuomid?: string | null
          createdby?: string
          createddate?: string
          defaultuomflag?: boolean
          modifiedby?: string
          modifieddate?: string
          scaleorder?: number | null
          uomcategoryid: string
          uomcode: number
          uomdescription: string
          uomid?: string
          uomname: string
        }
        Update: {
          baseuomid?: string | null
          createdby?: string
          createddate?: string
          defaultuomflag?: boolean
          modifiedby?: string
          modifieddate?: string
          scaleorder?: number | null
          uomcategoryid?: string
          uomcode?: number
          uomdescription?: string
          uomid?: string
          uomname?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_uom_uom"
            columns: ["baseuomid"]
            isOneToOne: false
            referencedRelation: "uom"
            referencedColumns: ["uomid"]
          },
          {
            foreignKeyName: "fk_uom_uomcategory"
            columns: ["uomcategoryid"]
            isOneToOne: false
            referencedRelation: "uomcategory"
            referencedColumns: ["uomcategoryid"]
          },
        ]
      }
      uomcategory: {
        Row: {
          createdby: string
          createddate: string
          modifiedby: string
          modifieddate: string
          uomcategorycode: string
          uomcategoryid: string
          uomcategoryname: string
        }
        Insert: {
          createdby?: string
          createddate?: string
          modifiedby?: string
          modifieddate?: string
          uomcategorycode: string
          uomcategoryid?: string
          uomcategoryname: string
        }
        Update: {
          createdby?: string
          createddate?: string
          modifiedby?: string
          modifieddate?: string
          uomcategorycode?: string
          uomcategoryid?: string
          uomcategoryname?: string
        }
        Relationships: []
      }
      uomconversion: {
        Row: {
          baseconversionfactor: number
          conversionfactor: number
          createdby: string
          createddate: string
          destinationuomid: string
          directconversionflag: boolean
          modifiedby: string
          modifieddate: string
          sourceuomid: string
          uomconversionid: string
          variableuomid: string | null
        }
        Insert: {
          baseconversionfactor?: number
          conversionfactor?: number
          createdby?: string
          createddate?: string
          destinationuomid: string
          directconversionflag?: boolean
          modifiedby?: string
          modifieddate?: string
          sourceuomid: string
          uomconversionid?: string
          variableuomid?: string | null
        }
        Update: {
          baseconversionfactor?: number
          conversionfactor?: number
          createdby?: string
          createddate?: string
          destinationuomid?: string
          directconversionflag?: boolean
          modifiedby?: string
          modifieddate?: string
          sourceuomid?: string
          uomconversionid?: string
          variableuomid?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_uomconversion_destinationuom"
            columns: ["destinationuomid"]
            isOneToOne: false
            referencedRelation: "uom"
            referencedColumns: ["uomid"]
          },
          {
            foreignKeyName: "fk_uomconversion_sourceuom"
            columns: ["sourceuomid"]
            isOneToOne: false
            referencedRelation: "uom"
            referencedColumns: ["uomid"]
          },
          {
            foreignKeyName: "fk_uomconversion_variableuom"
            columns: ["variableuomid"]
            isOneToOne: false
            referencedRelation: "uom"
            referencedColumns: ["uomid"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_common_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  _secure: {
    Tables: {
      applicationuser: {
        Row: {
          applicationuserid: string
          applicationuserotherdetails: Json | null
          authenticationprincipalotherdetails: Json | null
          authuserid: string | null
          createdby: string
          createddate: string
          modifiedby: string
          modifieddate: string
          organizationuserid: string
        }
        Insert: {
          applicationuserid?: string
          applicationuserotherdetails?: Json | null
          authenticationprincipalotherdetails?: Json | null
          authuserid?: string | null
          createdby?: string
          createddate?: string
          modifiedby?: string
          modifieddate?: string
          organizationuserid: string
        }
        Update: {
          applicationuserid?: string
          applicationuserotherdetails?: Json | null
          authenticationprincipalotherdetails?: Json | null
          authuserid?: string | null
          createdby?: string
          createddate?: string
          modifiedby?: string
          modifieddate?: string
          organizationuserid?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_applicationuser_organizationuser"
            columns: ["organizationuserid"]
            isOneToOne: true
            referencedRelation: "organizationuser"
            referencedColumns: ["organizationuserid"]
          },
        ]
      }
      applicationuserrole: {
        Row: {
          applicationuserid: string
          applicationuserroleid: string
          createdby: string
          createddate: string
          modifiedby: string
          modifieddate: string
          roleid: string
        }
        Insert: {
          applicationuserid: string
          applicationuserroleid?: string
          createdby?: string
          createddate?: string
          modifiedby?: string
          modifieddate?: string
          roleid: string
        }
        Update: {
          applicationuserid?: string
          applicationuserroleid?: string
          createdby?: string
          createddate?: string
          modifiedby?: string
          modifieddate?: string
          roleid?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_applicationuserrole_applicationuser"
            columns: ["applicationuserid"]
            isOneToOne: false
            referencedRelation: "applicationuser"
            referencedColumns: ["applicationuserid"]
          },
          {
            foreignKeyName: "fk_applicationuserrole_role"
            columns: ["roleid"]
            isOneToOne: false
            referencedRelation: "role"
            referencedColumns: ["roleid"]
          },
        ]
      }
      inbox: {
        Row: {
          applicationuserid: string | null
          createdby: string
          createddate: string
          inboxid: string
          messagebody: string | null
          messagedate: string
          messagepriority: number | null
          messagesubject: string | null
          modifiedby: string
          modifieddate: string
          moduleid: string
          roleid: string | null
          status: string
        }
        Insert: {
          applicationuserid?: string | null
          createdby?: string
          createddate?: string
          inboxid?: string
          messagebody?: string | null
          messagedate?: string
          messagepriority?: number | null
          messagesubject?: string | null
          modifiedby?: string
          modifieddate?: string
          moduleid: string
          roleid?: string | null
          status?: string
        }
        Update: {
          applicationuserid?: string | null
          createdby?: string
          createddate?: string
          inboxid?: string
          messagebody?: string | null
          messagedate?: string
          messagepriority?: number | null
          messagesubject?: string | null
          modifiedby?: string
          modifieddate?: string
          moduleid?: string
          roleid?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_inbox_applicationuser"
            columns: ["applicationuserid"]
            isOneToOne: false
            referencedRelation: "applicationuser"
            referencedColumns: ["applicationuserid"]
          },
          {
            foreignKeyName: "fk_inbox_role"
            columns: ["roleid"]
            isOneToOne: false
            referencedRelation: "role"
            referencedColumns: ["roleid"]
          },
        ]
      }
      organization: {
        Row: {
          createdby: string
          createddate: string
          modifiedby: string
          modifieddate: string
          organizationcode: string
          organizationid: string
          organizationname: string
        }
        Insert: {
          createdby?: string
          createddate?: string
          modifiedby?: string
          modifieddate?: string
          organizationcode: string
          organizationid?: string
          organizationname: string
        }
        Update: {
          createdby?: string
          createddate?: string
          modifiedby?: string
          modifieddate?: string
          organizationcode?: string
          organizationid?: string
          organizationname?: string
        }
        Relationships: []
      }
      organizationuser: {
        Row: {
          createdby: string
          createddate: string
          displayname: string | null
          employmentenddate: string | null
          employmentstartdate: string
          fullname: string
          modifiedby: string
          modifieddate: string
          officenumber: string | null
          officenumbercountrycode: string | null
          organizationid: string
          organizationuserid: string
          otherdetails: Json | null
          primaryemail: string
          primarymobilenumber: string | null
          primarymobilenumbercountrycode: string | null
          secondaryemail: string | null
          secondarymobilenumber: string | null
          secondarymobilenumbercountrycode: string | null
        }
        Insert: {
          createdby?: string
          createddate?: string
          displayname?: string | null
          employmentenddate?: string | null
          employmentstartdate: string
          fullname: string
          modifiedby?: string
          modifieddate?: string
          officenumber?: string | null
          officenumbercountrycode?: string | null
          organizationid: string
          organizationuserid?: string
          otherdetails?: Json | null
          primaryemail: string
          primarymobilenumber?: string | null
          primarymobilenumbercountrycode?: string | null
          secondaryemail?: string | null
          secondarymobilenumber?: string | null
          secondarymobilenumbercountrycode?: string | null
        }
        Update: {
          createdby?: string
          createddate?: string
          displayname?: string | null
          employmentenddate?: string | null
          employmentstartdate?: string
          fullname?: string
          modifiedby?: string
          modifieddate?: string
          officenumber?: string | null
          officenumbercountrycode?: string | null
          organizationid?: string
          organizationuserid?: string
          otherdetails?: Json | null
          primaryemail?: string
          primarymobilenumber?: string | null
          primarymobilenumbercountrycode?: string | null
          secondaryemail?: string | null
          secondarymobilenumber?: string | null
          secondarymobilenumbercountrycode?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_organizationuser_organization"
            columns: ["organizationid"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["organizationid"]
          },
        ]
      }
      role: {
        Row: {
          createdby: string
          createddate: string
          modifiedby: string | null
          modifieddate: string | null
          rolecode: string
          roledescription: string | null
          roleid: string
          rolename: string
          systemroleflag: boolean
        }
        Insert: {
          createdby?: string
          createddate?: string
          modifiedby?: string | null
          modifieddate?: string | null
          rolecode: string
          roledescription?: string | null
          roleid?: string
          rolename: string
          systemroleflag?: boolean
        }
        Update: {
          createdby?: string
          createddate?: string
          modifiedby?: string | null
          modifieddate?: string | null
          rolecode?: string
          roledescription?: string | null
          roleid?: string
          rolename?: string
          systemroleflag?: boolean
        }
        Relationships: []
      }
      rolescreen: {
        Row: {
          createdby: string
          createddate: string
          deleteflag: boolean
          modifiedby: string
          modifieddate: string
          readflag: boolean
          roleid: string
          rolescreenid: string
          screenid: string
          writeflag: boolean
        }
        Insert: {
          createdby?: string
          createddate?: string
          deleteflag?: boolean
          modifiedby?: string
          modifieddate?: string
          readflag?: boolean
          roleid: string
          rolescreenid?: string
          screenid: string
          writeflag?: boolean
        }
        Update: {
          createdby?: string
          createddate?: string
          deleteflag?: boolean
          modifiedby?: string
          modifieddate?: string
          readflag?: boolean
          roleid?: string
          rolescreenid?: string
          screenid?: string
          writeflag?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "fk_rolescreen_role"
            columns: ["roleid"]
            isOneToOne: false
            referencedRelation: "role"
            referencedColumns: ["roleid"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_read_inbox: {
        Args: { target_applicationuserid: string; target_roleid: string }
        Returns: boolean
      }
      is_current_applicationuser: {
        Args: { target_applicationuserid: string }
        Returns: boolean
      }
      is_current_organizationuser: {
        Args: { target_organizationuserid: string }
        Returns: boolean
      }
      is_secure_admin: { Args: never; Returns: boolean }
      is_secure_inbox_admin: { Args: never; Returns: boolean }
      is_secure_org_admin: { Args: never; Returns: boolean }
      is_secure_user_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  _sysconfig: {
    Tables: {
      configurationgroup: {
        Row: {
          configurationgroupdescription: string | null
          configurationgroupid: string
          configurationgroupname: string
          createdby: string
          createddate: string
          modifiedby: string
          modifieddate: string
          parentconfigurationgroupid: string | null
          sortorder: number
        }
        Insert: {
          configurationgroupdescription?: string | null
          configurationgroupid?: string
          configurationgroupname: string
          createdby?: string
          createddate?: string
          modifiedby?: string
          modifieddate?: string
          parentconfigurationgroupid?: string | null
          sortorder?: number
        }
        Update: {
          configurationgroupdescription?: string | null
          configurationgroupid?: string
          configurationgroupname?: string
          createdby?: string
          createddate?: string
          modifiedby?: string
          modifieddate?: string
          parentconfigurationgroupid?: string | null
          sortorder?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_configurationgroup_parentconfigurationgroup"
            columns: ["parentconfigurationgroupid"]
            isOneToOne: false
            referencedRelation: "configurationgroup"
            referencedColumns: ["configurationgroupid"]
          },
        ]
      }
      configurationsetting: {
        Row: {
          attributedatatypeid: string
          configurationgroupid: string
          configurationsettingdescription: string
          configurationsettingid: string
          configurationsettingname: string
          configurationsettingvalueboolean: boolean | null
          configurationsettingvaluedatetime: string | null
          configurationsettingvalueinteger: number | null
          configurationsettingvaluenumeric: number | null
          configurationsettingvaluetext: string | null
          configurationsettingvaluetime: string | null
          createdby: string
          createddate: string
          isdisabled: boolean
          modifiedby: string
          modifieddate: string
        }
        Insert: {
          attributedatatypeid: string
          configurationgroupid: string
          configurationsettingdescription: string
          configurationsettingid?: string
          configurationsettingname: string
          configurationsettingvalueboolean?: boolean | null
          configurationsettingvaluedatetime?: string | null
          configurationsettingvalueinteger?: number | null
          configurationsettingvaluenumeric?: number | null
          configurationsettingvaluetext?: string | null
          configurationsettingvaluetime?: string | null
          createdby?: string
          createddate?: string
          isdisabled?: boolean
          modifiedby?: string
          modifieddate?: string
        }
        Update: {
          attributedatatypeid?: string
          configurationgroupid?: string
          configurationsettingdescription?: string
          configurationsettingid?: string
          configurationsettingname?: string
          configurationsettingvalueboolean?: boolean | null
          configurationsettingvaluedatetime?: string | null
          configurationsettingvalueinteger?: number | null
          configurationsettingvaluenumeric?: number | null
          configurationsettingvaluetext?: string | null
          configurationsettingvaluetime?: string | null
          createdby?: string
          createddate?: string
          isdisabled?: boolean
          modifiedby?: string
          modifieddate?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_configurationsetting_configurationgroup"
            columns: ["configurationgroupid"]
            isOneToOne: false
            referencedRelation: "configurationgroup"
            referencedColumns: ["configurationgroupid"]
          },
        ]
      }
      systemsequence: {
        Row: {
          createdby: string
          createddate: string
          modifiedby: string
          modifieddate: string
          systemsequenceid: string
          systemsequencename: string
          systemsequencevalue: number
        }
        Insert: {
          createdby?: string
          createddate?: string
          modifiedby?: string
          modifieddate?: string
          systemsequenceid?: string
          systemsequencename: string
          systemsequencevalue: number
        }
        Update: {
          createdby?: string
          createddate?: string
          modifiedby?: string
          modifieddate?: string
          systemsequenceid?: string
          systemsequencename?: string
          systemsequencevalue?: number
        }
        Relationships: []
      }
      systemvalue: {
        Row: {
          createdby: string
          createddate: string
          modifiedby: string
          modifieddate: string
          systemvalueboolean: boolean | null
          systemvaluecode: string
          systemvaluedatetime: string | null
          systemvalueid: string
          systemvalueinteger: number | null
          systemvaluenumeric: number | null
          systemvaluetext: string | null
          systemvaluetime: string | null
        }
        Insert: {
          createdby?: string
          createddate?: string
          modifiedby?: string
          modifieddate?: string
          systemvalueboolean?: boolean | null
          systemvaluecode: string
          systemvaluedatetime?: string | null
          systemvalueid?: string
          systemvalueinteger?: number | null
          systemvaluenumeric?: number | null
          systemvaluetext?: string | null
          systemvaluetime?: string | null
        }
        Update: {
          createdby?: string
          createddate?: string
          modifiedby?: string
          modifieddate?: string
          systemvalueboolean?: boolean | null
          systemvaluecode?: string
          systemvaluedatetime?: string | null
          systemvalueid?: string
          systemvalueinteger?: number | null
          systemvaluenumeric?: number | null
          systemvaluetext?: string | null
          systemvaluetime?: string | null
        }
        Relationships: []
      }
      systemvariable: {
        Row: {
          createdby: string
          createddate: string
          modifiedby: string
          modifieddate: string
          systemvariablecode: string
          systemvariabledescription: string
          systemvariableid: string
          systemvariablesql: string | null
        }
        Insert: {
          createdby?: string
          createddate?: string
          modifiedby?: string
          modifieddate?: string
          systemvariablecode: string
          systemvariabledescription: string
          systemvariableid?: string
          systemvariablesql?: string | null
        }
        Update: {
          createdby?: string
          createddate?: string
          modifiedby?: string
          modifieddate?: string
          systemvariablecode?: string
          systemvariabledescription?: string
          systemvariableid?: string
          systemvariablesql?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_sysconfig_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  _visitor: {
    Tables: {
      visitorequipment: {
        Row: {
          createdby: string
          createddate: string
          itemdescription: string
          itemtypeid: string
          modifiedby: string
          modifieddate: string
          quantity: number
          serialnumber: string | null
          visitorequipmentid: string
          visitorregisterid: string
        }
        Insert: {
          createdby?: string
          createddate?: string
          itemdescription: string
          itemtypeid: string
          modifiedby?: string
          modifieddate?: string
          quantity?: number
          serialnumber?: string | null
          visitorequipmentid?: string
          visitorregisterid: string
        }
        Update: {
          createdby?: string
          createddate?: string
          itemdescription?: string
          itemtypeid?: string
          modifiedby?: string
          modifieddate?: string
          quantity?: number
          serialnumber?: string | null
          visitorequipmentid?: string
          visitorregisterid?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_visitorequipment_visitorregister"
            columns: ["visitorregisterid"]
            isOneToOne: false
            referencedRelation: "visitorregister"
            referencedColumns: ["visitorregisterid"]
          },
        ]
      }
      visitorregister: {
        Row: {
          consentvideocontent: string | null
          createdby: string
          createddate: string
          emailaddress: string | null
          entrydate: string
          exitdate: string | null
          exitloggedby: string | null
          exitloggeddate: string | null
          fullname: string
          hostid: string
          isconsentvideorecord: boolean
          isprivacypolicyread: boolean
          mobilenumber: string | null
          mobilenumbercountrydialid: string | null
          modifiedby: string
          modifieddate: string
          organization: string | null
          otherdetails: Json | null
          privacypolicycontent: string | null
          visitorregisterid: string
          visitpurposeid: string
        }
        Insert: {
          consentvideocontent?: string | null
          createdby?: string
          createddate?: string
          emailaddress?: string | null
          entrydate?: string
          exitdate?: string | null
          exitloggedby?: string | null
          exitloggeddate?: string | null
          fullname: string
          hostid: string
          isconsentvideorecord?: boolean
          isprivacypolicyread?: boolean
          mobilenumber?: string | null
          mobilenumbercountrydialid?: string | null
          modifiedby?: string
          modifieddate?: string
          organization?: string | null
          otherdetails?: Json | null
          privacypolicycontent?: string | null
          visitorregisterid?: string
          visitpurposeid: string
        }
        Update: {
          consentvideocontent?: string | null
          createdby?: string
          createddate?: string
          emailaddress?: string | null
          entrydate?: string
          exitdate?: string | null
          exitloggedby?: string | null
          exitloggeddate?: string | null
          fullname?: string
          hostid?: string
          isconsentvideorecord?: boolean
          isprivacypolicyread?: boolean
          mobilenumber?: string | null
          mobilenumbercountrydialid?: string | null
          modifiedby?: string
          modifieddate?: string
          organization?: string | null
          otherdetails?: Json | null
          privacypolicycontent?: string | null
          visitorregisterid?: string
          visitpurposeid?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_access_visitorregister: {
        Args: { target_visitorregisterid: string }
        Returns: boolean
      }
      is_current_host: { Args: { target_hostid: string }; Returns: boolean }
      is_visitor_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_orguser: { Args: never; Returns: string }
      current_user_roles: { Args: never; Returns: string[] }
      has_any_role: { Args: { required: string[] }; Returns: boolean }
      next_number: {
        Args: { p_increment?: number; p_name: string }
        Returns: number
      }
      uuid_generate_v7: { Args: never; Returns: string }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  _arch: {
    Enums: {},
  },
  _batch: {
    Enums: {},
  },
  _calendar: {
    Enums: {},
  },
  _common: {
    Enums: {},
  },
  _secure: {
    Enums: {},
  },
  _sysconfig: {
    Enums: {},
  },
  _visitor: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
