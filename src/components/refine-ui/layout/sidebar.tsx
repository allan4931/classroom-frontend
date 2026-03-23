"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar as ShadcnSidebar,
  SidebarContent as ShadcnSidebarContent,
  SidebarHeader as ShadcnSidebarHeader,
  SidebarRail as ShadcnSidebarRail,
  SidebarTrigger as ShadcnSidebarTrigger,
  useSidebar as useShadcnSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { useLink, useMenu, useRefineOptions, type TreeMenuItem } from "@refinedev/core";
import { ChevronRight, ListIcon } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { BACKEND_URL } from "@/constants";
import { getToken } from "@/providers/auth";

/** Navigation items shown per role — strict DOM removal, not just hidden */
const ROLE_NAV: Record<string, string[]> = {
  admin:   ["dashboard", "departments", "subjects", "classes", "users", "approvals"],
  teacher: ["dashboard", "classes"],
  student: ["dashboard", "classes"],
};

function usePendingCount() {
  const [count, setCount] = useState(0);
  const { isAdmin } = useCurrentUser();

  useEffect(() => {
    if (!isAdmin) return;
    const load = async () => {
      try {
        const res  = await fetch(`${BACKEND_URL}/api/approvals?status=pending&limit=1`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        const json = await res.json();
        setCount(json.pagination?.total ?? 0);
      } catch {}
    };
    load();
    const id = setInterval(load, 30_000); // poll every 30s
    return () => clearInterval(id);
  }, [isAdmin]);

  return count;
}

export function Sidebar() {
  const { open } = useShadcnSidebar();
  const { menuItems, selectedKey } = useMenu();
  const { role } = useCurrentUser();
  const pendingCount = usePendingCount();

  const allowed = ROLE_NAV[role ?? "student"] ?? ["dashboard"];
  const visibleItems = menuItems.filter((item: TreeMenuItem) => allowed.includes(item.name));

  return (
    <ShadcnSidebar collapsible="icon" className={cn("border-none")}>
      <ShadcnSidebarRail />
      <SidebarHeader />
      <ShadcnSidebarContent
        className={cn(
          "transition-discrete duration-200 flex flex-col gap-2 pt-2 pb-2 border-r border-border",
          { "px-3": open, "px-1": !open }
        )}
      >
        {visibleItems.map((item: TreeMenuItem) => (
          <SidebarItem
            key={item.key || item.name}
            item={item}
            selectedKey={selectedKey}
            pendingCount={item.name === "approvals" ? pendingCount : 0}
          />
        ))}
      </ShadcnSidebarContent>
    </ShadcnSidebar>
  );
}

type MenuItemProps = {
  item: TreeMenuItem;
  selectedKey?: string;
  pendingCount?: number;
};

function SidebarItem({ item, selectedKey, pendingCount = 0 }: MenuItemProps) {
  const { open } = useShadcnSidebar();

  if (item.meta?.group) return <SidebarItemGroup item={item} selectedKey={selectedKey} />;

  if (item.children && item.children.length > 0) {
    return open
      ? <SidebarItemCollapsible item={item} selectedKey={selectedKey} />
      : <SidebarItemDropdown item={item} selectedKey={selectedKey} />;
  }

  return <SidebarItemLink item={item} selectedKey={selectedKey} pendingCount={pendingCount} />;
}

function SidebarItemGroup({ item, selectedKey }: MenuItemProps) {
  const { open } = useShadcnSidebar();
  return (
    <div className={cn("border-t border-sidebar-border pt-4")}>
      <span className={cn("ml-3 block text-xs font-semibold uppercase text-muted-foreground transition-all duration-200",
        { "h-8": open, "h-0 opacity-0 pointer-events-none": !open })}>
        {getDisplayName(item)}
      </span>
      <div className="flex flex-col">
        {item.children?.map((child: TreeMenuItem) => (
          <SidebarItem key={child.key || child.name} item={child} selectedKey={selectedKey} />
        ))}
      </div>
    </div>
  );
}

function SidebarItemCollapsible({ item, selectedKey }: MenuItemProps) {
  return (
    <Collapsible key={`col-${item.name}`} className="w-full group">
      <CollapsibleTrigger asChild>
        <SidebarButton item={item} rightIcon={
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-90" />
        } />
      </CollapsibleTrigger>
      <CollapsibleContent className="ml-6 flex flex-col gap-2">
        {item.children?.map((child: TreeMenuItem) => (
          <SidebarItem key={child.key || child.name} item={child} selectedKey={selectedKey} />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}

function SidebarItemDropdown({ item, selectedKey }: MenuItemProps) {
  const Link = useLink();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild><SidebarButton item={item} /></DropdownMenuTrigger>
      <DropdownMenuContent side="right" align="start">
        {item.children?.map((child: TreeMenuItem) => {
          const isSelected = child.key === selectedKey;
          return (
            <DropdownMenuItem key={child.key || child.name} asChild>
              <Link to={child.route || ""}
                className={cn("flex w-full items-center gap-2", { "bg-accent text-accent-foreground": isSelected })}>
                <ItemIcon icon={child.meta?.icon ?? child.icon} isSelected={isSelected} />
                <span>{getDisplayName(child)}</span>
              </Link>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SidebarItemLink({ item, selectedKey, pendingCount = 0 }: MenuItemProps) {
  const isSelected = item.key === selectedKey;
  return <SidebarButton item={item} isSelected={isSelected} asLink={true} pendingCount={pendingCount} />;
}

function SidebarHeader() {
  const { title } = useRefineOptions();
  const { open, isMobile } = useShadcnSidebar();
  return (
    <ShadcnSidebarHeader className="p-0 h-16 border-b border-border flex-row items-center justify-between overflow-hidden">
      <div className={cn("whitespace-nowrap flex flex-row h-full items-center justify-start gap-2 transition-discrete duration-200",
        { "pl-3": !open, "pl-5": open })}>
        <div>{title.icon}</div>
        <h2 className={cn("text-sm font-bold transition-opacity duration-200",
          { "opacity-0": !open, "opacity-100": open })}>
          {title.text}
        </h2>
      </div>
      <ShadcnSidebarTrigger className={cn("text-muted-foreground mr-1.5",
        { "opacity-0 pointer-events-none": !open && !isMobile, "opacity-100 pointer-events-auto": open || isMobile })} />
    </ShadcnSidebarHeader>
  );
}

function getDisplayName(item: TreeMenuItem) { return item.meta?.label ?? item.label ?? item.name; }

function ItemIcon({ icon, isSelected }: { icon: React.ReactNode; isSelected?: boolean }) {
  return (
    <div className={cn("w-4", { "text-muted-foreground": !isSelected, "text-sidebar-primary-foreground": isSelected })}>
      {icon ?? <ListIcon />}
    </div>
  );
}

type SidebarButtonProps = React.ComponentProps<typeof Button> & {
  item: TreeMenuItem;
  isSelected?: boolean;
  rightIcon?: React.ReactNode;
  asLink?: boolean;
  pendingCount?: number;
};

function SidebarButton({ item, isSelected = false, rightIcon, asLink = false, className, pendingCount = 0, ...props }: SidebarButtonProps) {
  const Link = useLink();
  const { open } = useShadcnSidebar();

  const buttonContent = (
    <>
      <ItemIcon icon={item.meta?.icon ?? item.icon} isSelected={isSelected} />
      <span className={cn("tracking-[-0.00875rem]", {
        "flex-1 text-left": rightIcon,
        "line-clamp-1 truncate": !rightIcon,
        "font-normal": !isSelected,
        "font-semibold text-sidebar-primary-foreground": isSelected,
        "text-foreground": !isSelected,
      })}>
        {getDisplayName(item)}
      </span>
      {pendingCount > 0 && open && (
        <Badge className="ml-auto text-[10px] px-1.5 py-0 h-4 bg-amber-500 text-white border-0 shrink-0">
          {pendingCount > 99 ? "99+" : pendingCount}
        </Badge>
      )}
      {rightIcon}
    </>
  );

  return (
    <Button
      asChild={!!(asLink && item.route)}
      variant="ghost"
      size="lg"
      className={cn("flex w-full items-center justify-start gap-2 py-2 !px-3 text-sm", {
        "bg-sidebar-primary hover:!bg-sidebar-primary/90 text-sidebar-primary-foreground hover:text-sidebar-primary-foreground": isSelected,
      }, className)}
      {...props}
    >
      {asLink && item.route
        ? <Link to={item.route} className="flex w-full items-center gap-2">{buttonContent}</Link>
        : buttonContent}
    </Button>
  );
}

Sidebar.displayName = "Sidebar";
