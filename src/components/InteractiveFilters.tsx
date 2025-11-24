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
      // Normalize values to strings
      initial[filter.columnName] = (filter.values || []).map((v) =>
        String(v ?? "")
      );
    });
    return initial;
  });

  const handleValueChange = (columnName: string, newValue: any[]) => {
    const normalized = newValue.map((v) => String(v ?? ""));

    const updatedValues = { ...currentValues, [columnName]: normalized };
    setCurrentValues(updatedValues);

    const updatedFilters = filters.map((filter) =>
      filter.columnName === columnName
        ? { ...filter, values: normalized }
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
      {filters.map((filter) => {
        const dropdownOptions = (filter.dropdownOptions || []).map((opt) =>
          String(opt ?? "")
        );

        return (
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

            {/* -------- Date Range (Between) -------- */}
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
                  {dropdownOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
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
                  {dropdownOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* -------- EQ → Single Select via MultiSelectDropdown -------- */}
            {filter.operator === RuntimeFilterOp.EQ && (
              <MultiSelectDropdown
                value={(currentValues[filter.columnName] || []).map((v: any) =>
                  String(v ?? "")
                )}
                onChange={(selected) => {
                  const finalValue =
                    selected.length > 0
                      ? [String(selected[selected.length - 1])]
                      : [];
                  handleValueChange(filter.columnName, finalValue);
                }}
                options={dropdownOptions.map((opt) => ({
                  id: opt,
                  name: opt,
                }))}
                placeholder={`Select ${filter.columnName}...`}
                searchPlaceholder="Search..."
                label=""
              />
            )}

            {/* -------- IN → Multi Select via MultiSelectDropdown -------- */}
            {filter.operator === RuntimeFilterOp.IN && (
              <MultiSelectDropdown
                value={(currentValues[filter.columnName] || []).map((v: any) =>
                  String(v ?? "")
                )}
                onChange={(selected) =>
                  handleValueChange(
                    filter.columnName,
                    selected.map((v: any) => String(v ?? ""))
                  )
                }
                options={dropdownOptions.map((opt) => ({
                  id: opt,
                  name: opt,
                }))}
                placeholder={`Select ${filter.columnName}...`}
                searchPlaceholder="Search..."
                label=""
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
