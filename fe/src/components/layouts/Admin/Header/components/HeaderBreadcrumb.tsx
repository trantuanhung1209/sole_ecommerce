import React from "react";
import { ChevronRight, Home } from "lucide-react";
import { Link, useInRouterContext } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export interface BreadcrumbItemData {
  label: string;
  href?: string;
  isCurrentPage?: boolean;
}

interface HeaderBreadcrumbProps {
  items?: BreadcrumbItemData[];
}

function HeaderBreadcrumb({ items = [] }: HeaderBreadcrumbProps) {
  const inRouter = useInRouterContext();

  return (
    <Breadcrumb>
      <BreadcrumbList className="text-xs">
        <BreadcrumbItem>
          {inRouter ? (
            <BreadcrumbLink asChild className="flex items-center space-x-1">
              <Link to="/admin">
                <Home className="h-3 w-3" />
                <span>Trang chủ</span>
              </Link>
            </BreadcrumbLink>
          ) : (
            <BreadcrumbLink href="/admin" className="flex items-center space-x-1">
              <Home className="h-3 w-3" />
              <span>Trang chủ</span>
            </BreadcrumbLink>
          )}
        </BreadcrumbItem>

        {items.map((item, index) => (
          <React.Fragment key={index}>
            <BreadcrumbSeparator>
              <ChevronRight className="h-3 w-3" />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              {item.isCurrentPage || !item.href ? (
                <BreadcrumbPage>{item.label}</BreadcrumbPage>
              ) : inRouter ? (
                <BreadcrumbLink asChild>
                  <Link to={item.href}>{item.label}</Link>
                </BreadcrumbLink>
              ) : (
                <BreadcrumbLink href={item.href}>{item.label}</BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

export default HeaderBreadcrumb;
