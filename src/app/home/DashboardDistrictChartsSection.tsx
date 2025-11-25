// Dashboard ส่วนแสดงกราฟรายพื้นที่ (เปอร์เซ็นต์ + สถานะ)
"use client";

import React from "react";
import DashboardDistrictPercentChart, {
  DistrictDataItem,
  Theme as PercentTheme,
} from "./DashboardDistrictPercentChart";
import DashboardDistrictStatusChart, {
  DistrictComparisonItem,
  Theme as StatusTheme,
} from "./DashboardDistrictStatusChart";

interface Props {
  selectedDistrictScope: string;
  districtData: DistrictDataItem[];
  districtComparisonData: DistrictComparisonItem[];
  theme: PercentTheme & StatusTheme;
}

const DashboardDistrictChartsSection: React.FC<Props> = ({
  selectedDistrictScope,
  districtData,
  districtComparisonData,
  theme,
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <DashboardDistrictPercentChart
        selectedDistrictScope={selectedDistrictScope}
        districtData={districtData}
        theme={theme}
      />
      <DashboardDistrictStatusChart
        districtComparisonData={districtComparisonData}
        theme={theme}
      />
    </div>
  );
};

export default DashboardDistrictChartsSection;
