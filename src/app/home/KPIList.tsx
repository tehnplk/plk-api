"use client";

import React from "react";
import KPITable from "../components/KPITable";

interface KPIListProps {
  selectedDepartment: string;
  moneyYear: number;
  refreshVersion: number;
  session: any;
  selectedDistrictScope: string;
}

export default function KPIList({
  selectedDepartment,
  moneyYear,
  refreshVersion,
  session,
  selectedDistrictScope,
}: KPIListProps) {
  return (
    <div id="kpi-table-section">
      <KPITable
        initialDepartment={selectedDepartment}
        moneyYear={moneyYear}
        refreshVersion={refreshVersion}
        showHeaderSummary
        showRowCountSummary
        session={session}
        selectedDistrictScope={selectedDistrictScope}
      />
    </div>
  );
}
