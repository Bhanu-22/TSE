"use client";  
  
import { useState } from "react";  
import { RuntimeFilter, RuntimeFilterOp } from "../types/thoughtspot";  
import MultiSelectDropdown from "./MultiSelectDropdown";  
  
interface InteractiveFiltersProps {  
  filters: RuntimeFilter[];  
  onFilterChange: (filters: RuntimeFilter[]) => void;  
}  
  
export default function InteractiveFilters({  
  filters,  
  onFilterChange,  
}: InteractiveFiltersProps) {  
  const [currentValues, setCurrentValues] = useState<Record<string, any>>(() => {  
    const initial: Record<string, any> = {};  
    filters.forEach((filter) => {  
      initial[filter.columnName] = filter.values;  
    });  
    return initial;  
  });  
  
  const handleValueChange = (columnName: string, newValue: any) => {  
    const updatedValues = { ...currentValues, [columnName]: newValue };  
    setCurrentValues(updatedValues);  
  
    const updatedFilters = filters.map((filter) =>  
      filter.columnName === columnName  
        ? { ...filter, values: Array.isArray(newValue) ? newValue : [newValue] }  
        : filter  
    );  
    onFilterChange(updatedFilters);  
  };  
  
  return (  
    <div  
      style={{  
        padding: "20px",  
        borderBottom: "1px solid #e5e7eb",  
        backgroundColor: "#f9fafb",  
        display: "flex",  
        gap: "20px",  
        flexWrap: "wrap",  
      }}  
    >  
      {filters.map((filter) => (  
        <div key={filter.columnName} style={{ minWidth: "200px" }}>  
          <label  
            style={{  
              display: "block",  
              fontSize: "12px",  
              fontWeight: "600",  
              marginBottom: "8px",  
              color: "#374151",  
            }}  
          >  
            {filter.columnName}  
          </label>  
  
          {/* For date range filters (BW_INC operator) - Keep as-is */}  
          {filter.operator === RuntimeFilterOp.BW_INC && (  
            <div style={{ display: "flex", gap: "8px" }}>  
              <select  
                value={currentValues[filter.columnName]?.[0] || ""}  
                onChange={(e) =>  
                  handleValueChange(filter.columnName, [  
                    e.target.value,  
                    currentValues[filter.columnName]?.[1] || "",  
                  ])  
                }  
                style={{  
                  padding: "8px",  
                  border: "1px solid #d1d5db",  
                  borderRadius: "4px",  
                  fontSize: "14px",  
                  flex: 1,  
                }}  
              >  
                <option value="">Start Date</option>  
                {filter.dropdownOptions?.map((option) => (  
                  <option key={option} value={option}>  
                    {option}  
                  </option>  
                ))}  
              </select>  
              <select  
                value={currentValues[filter.columnName]?.[1] || ""}  
                onChange={(e) =>  
                  handleValueChange(filter.columnName, [  
                    currentValues[filter.columnName]?.[0] || "",  
                    e.target.value,  
                  ])  
                }  
                style={{  
                  padding: "8px",  
                  border: "1px solid #d1d5db",  
                  borderRadius: "4px",  
                  fontSize: "14px",  
                  flex: 1,  
                }}  
              >  
                <option value="">End Date</option>  
                {filter.dropdownOptions?.map((option) => (  
                  <option key={option} value={option}>  
                    {option}  
                  </option>  
                ))}  
              </select>  
            </div>  
          )}  
  
          {/* EQ operator → Single-select dropdown (radio behavior) */}  
          {filter.operator === RuntimeFilterOp.EQ && (  
            <MultiSelectDropdown  
              value={currentValues[filter.columnName] || []}  
              onChange={(selectedValues) => {  
                // For EQ, only allow one selection  
                const newValue = selectedValues.length > 0 ? [selectedValues[selectedValues.length - 1]] : [];  
                handleValueChange(filter.columnName, newValue);  
              }}  
              options={  
                filter.dropdownOptions?.map((opt) => ({  
                  id: String(opt),  
                  name: String(opt),  
                })) || []  
              }  
              placeholder={`Select ${filter.columnName}...`}  
              searchPlaceholder="Search..."  
              label=""  
            />  
          )}  
  
          {/* IN operator → Multi-select dropdown */}  
          {filter.operator === RuntimeFilterOp.IN && (  
            <MultiSelectDropdown  
              value={currentValues[filter.columnName] || []}  
              onChange={(selectedValues) => {  
                handleValueChange(filter.columnName, selectedValues);  
              }}  
              options={  
                filter.dropdownOptions?.map((opt) => ({  
                  id: String(opt),  
                  name: String(opt),  
                })) || []  
              }  
              placeholder={`Select ${filter.columnName}...`}  
              searchPlaceholder="Search..."  
              label=""  
            />  
          )}  
        </div>  
      ))}  
    </div>  
  );  
}