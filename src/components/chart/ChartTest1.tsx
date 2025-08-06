import React, { useRef } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartConfiguration,
  ChartEvent,
  ActiveElement,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);
const ChartTest1 = () => {
  const chartRef = useRef<ChartJS<"line">>(null);

  const data = {
    labels: ["January", "February", "March", "April", "May", "June", "July"],
    datasets: [
      {
        label: "Dataset 1",
        data: [65, 59, 80, 81, 56, 55, 40],
        borderColor: "rgb(75, 192, 192)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        borderWidth: 2,
      },
      {
        label: "Dataset 2",
        data: [28, 48, 40, 19, 86, 27, 90],
        borderColor: "rgb(255, 99, 132)",
        backgroundColor: "rgba(255, 99, 132, 0.2)",
        borderWidth: 2,
      },
    ],
  };

  const options: ChartConfiguration<"line">["options"] = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Chart.js Line Chart",
      },
    },
    interaction: {
      mode: "nearest",
      intersect: true,
    },
    onHover: (event: ChartEvent, chartElement: ActiveElement[]) => {
      const chart = chartRef.current;
      if (chart) {
        const elements = chart.getElementsAtEventForMode(
          event as unknown as Event,
          "nearest",
          { intersect: true },
          true
        );
        if (elements.length) {
          const datasetIndex = elements[0].datasetIndex;
          chart.data.datasets.forEach((dataset, index) => {
            dataset.borderWidth = index === datasetIndex ? 4 : 2;
          });
          chart.update();
        }
      }
    },
    onClick: (event: ChartEvent, chartElement: ActiveElement[]) => {
      const chart = chartRef.current;
      if (chart) {
        const elements = chart.getElementsAtEventForMode(
          event as unknown as Event,
          "nearest",
          { intersect: true },
          true
        );
        if (elements.length) {
          const datasetIndex = elements[0].datasetIndex;
          if (datasetIndex !== undefined) {
            const label = chart.data.datasets[datasetIndex].label;
            console.log(`Clicked on dataset: ${label}`);
          }
        }
      }
    },
  };

  return (
    <div>
      <Line ref={chartRef} data={data} options={options} />
    </div>
  );
};

export default ChartTest1;
