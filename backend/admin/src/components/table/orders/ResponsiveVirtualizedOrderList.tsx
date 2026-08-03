"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Virtuoso } from "react-virtuoso";
import { IOrder } from "@/types/IOrder";
import OrderCard from "./OrderCard";
import EasyParcelShipmentDialog from "./EasyParcelShipmentDialog";
import { useLowPowerAnimations } from "@/hooks/useLowPowerAnimations";

interface ResponsiveVirtualizedOrderListProps {
  orders: IOrder[];
  scrollParent: HTMLElement | null;
  renderOrder?: (order: IOrder, card: React.ReactNode) => React.ReactNode;
}

const getOrderColumnCount = () => {
  if (typeof window === "undefined") return 1;
  if (window.matchMedia("(min-width: 1536px)").matches) return 4;
  if (window.matchMedia("(min-width: 1024px)").matches) return 3;
  if (window.matchMedia("(min-width: 768px)").matches) return 2;
  return 1;
};

function useOrderColumnCount() {
  const [columnCount, setColumnCount] = useState(getOrderColumnCount);

  useEffect(() => {
    const mediaQueries = [768, 1024, 1536].map((width) => window.matchMedia(`(min-width: ${width}px)`));
    const updateColumnCount = () => {
      setColumnCount(getOrderColumnCount());
    };

    updateColumnCount();
    mediaQueries.forEach((query) => query.addEventListener("change", updateColumnCount));
    return () => mediaQueries.forEach((query) => query.removeEventListener("change", updateColumnCount));
  }, []);

  return columnCount;
}

export default function ResponsiveVirtualizedOrderList({
  orders,
  scrollParent,
  renderOrder,
}: ResponsiveVirtualizedOrderListProps) {
  const lowPower = useLowPowerAnimations();
  const columnCount = useOrderColumnCount();
  const [minimizedOrderIds, setMinimizedOrderIds] = useState<Set<string>>(() => new Set());
  const [shipmentOrderId, setShipmentOrderId] = useState<string | null>(null);
  const rows = useMemo(() => {
    const nextRows: IOrder[][] = [];
    for (let index = 0; index < orders.length; index += columnCount) {
      nextRows.push(orders.slice(index, index + columnCount));
    }
    return nextRows;
  }, [orders, columnCount]);
  const shipmentOrder = shipmentOrderId
    ? orders.find((order) => order._id === shipmentOrderId) || null
    : null;

  if (!scrollParent) return <div className="min-h-px" aria-hidden="true" />;

  return (
    <>
      <Virtuoso
        key={columnCount}
        className="w-full"
        customScrollParent={scrollParent}
        data={rows}
        computeItemKey={(_, row) => row.map((order) => order._id).join(":")}
        increaseViewportBy={lowPower ? 0 : { top: 600, bottom: 1000 }}
        itemContent={(_, row) => (
          <div
            className="grid gap-6 pb-6"
            style={{ gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`, alignItems: "start" }}
          >
            {row.map((order) => {
              const isMinimized = minimizedOrderIds.has(order._id);
              const card = (
                <OrderCard
                  order={order}
                  isMinimized={isMinimized}
                  onMinimizedChange={(nextIsMinimized) => {
                    setMinimizedOrderIds((current) => {
                      const next = new Set(current);
                      if (nextIsMinimized) next.add(order._id);
                      else next.delete(order._id);
                      return next;
                    });
                  }}
                  onOpenShipmentDialog={(selectedOrder) => setShipmentOrderId(selectedOrder._id)}
                />
              );

              return <React.Fragment key={order._id}>{renderOrder ? renderOrder(order, card) : card}</React.Fragment>;
            })}
          </div>
        )}
      />
      {shipmentOrder && (
        <EasyParcelShipmentDialog
          order={shipmentOrder}
          open
          onOpenChange={(open) => {
            if (!open) setShipmentOrderId(null);
          }}
        />
      )}
    </>
  );
}
