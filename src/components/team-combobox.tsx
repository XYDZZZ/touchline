"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Plus, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TeamLogo } from "@/components/team-logo";
import { teams } from "@/data/teams";
import type { Team } from "@/lib/types";
import { useCustomTeams } from "@/hooks/use-custom-teams";

interface TeamComboboxProps {
  value: Team | null;
  onChange: (team: Team | null) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
}

/** Searchable team selector — shows crest + name in the trigger and in
 *  every dropdown option. Built on the shadcn Command + Popover pair.
 *  Supports custom teams stored in localStorage via the useCustomTeams hook. */
export function TeamCombobox({ value, onChange, placeholder = "Pilih tim…", disabled, id }: TeamComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [addingCustom, setAddingCustom] = React.useState(false);
  const [customName, setCustomName] = React.useState("");
  const [customLogo, setCustomLogo] = React.useState("");

  const { customTeams, addCustomTeam, removeCustomTeam } = useCustomTeams();

  function handleAddCustom() {
    if (!customName.trim()) return;
    const team = addCustomTeam(customName, customLogo || undefined);
    onChange(team);
    setCustomName("");
    setCustomLogo("");
    setAddingCustom(false);
    setOpen(false);
  }

  function handleRemoveCustom(e: React.MouseEvent, teamId: string) {
    e.stopPropagation();
    removeCustomTeam(teamId);
    if (value?.id === teamId) onChange(null);
  }

  return (
    <Popover open={open} onOpenChange={(o) => { setOpen(o); if (!o) setAddingCustom(false); }}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="h-11 w-full justify-between font-normal"
        >
          {value ? (
            <span className="flex min-w-0 items-center gap-2">
              <TeamLogo name={value.name} logoUrl={value.logo_url} short={value.short} size={22} />
              <span className="truncate">{value.name}</span>
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder ?? "Pilih tim…"}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-80 p-0" align="start">
        {addingCustom ? (
          <div className="space-y-3 p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Tambah tim baru</span>
              <button
                type="button"
                onClick={() => setAddingCustom(false)}
                className="rounded p-0.5 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <Input
              autoFocus
              placeholder="Nama tim *"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddCustom()}
              className="h-9"
            />
            <Input
              placeholder="URL logo (opsional)"
              value={customLogo}
              onChange={(e) => setCustomLogo(e.target.value)}
              className="h-9"
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setAddingCustom(false)}
              >
                Batal
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleAddCustom}
                disabled={!customName.trim()}
              >
                Tambah
              </Button>
            </div>
          </div>
        ) : (
          <Command>
            <CommandInput placeholder="Cari tim…" />
            <CommandList>
              <CommandEmpty>Tim tidak ditemukan.</CommandEmpty>

              {customTeams.length > 0 && (
                <>
                  <CommandGroup heading="Tim Custom">
                    {customTeams.map((team) => (
                      <CommandItem
                        key={team.id}
                        value={`custom ${team.name}`}
                        onSelect={() => {
                          onChange(team.id === value?.id ? null : team);
                          setOpen(false);
                        }}
                        className="group"
                      >
                        <TeamLogo name={team.name} logoUrl={team.logo_url} short={team.short} size={20} />
                        <span className="flex-1 truncate">{team.name}</span>
                        <Check
                          className={cn("h-4 w-4 shrink-0", value?.id === team.id ? "opacity-100" : "opacity-0")}
                        />
                        <button
                          type="button"
                          onClick={(e) => handleRemoveCustom(e, team.id)}
                          className="ml-1 rounded p-0.5 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                          aria-label="Hapus tim custom"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                  <CommandSeparator />
                </>
              )}

              <CommandGroup heading="Tim Tersedia">
                {teams.map((team) => (
                  <CommandItem
                    key={team.id}
                    value={`${team.name} ${team.short ?? ""}`}
                    onSelect={() => {
                      onChange(team.id === value?.id ? null : team);
                      setOpen(false);
                    }}
                  >
                    <TeamLogo name={team.name} logoUrl={team.logo_url} short={team.short} size={20} />
                    <span>{team.name}</span>
                    <Check
                      className={cn("ml-auto h-4 w-4", value?.id === team.id ? "opacity-100" : "opacity-0")}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>

              <CommandSeparator />
              <CommandGroup>
                <CommandItem
                  onSelect={() => setAddingCustom(true)}
                  className="text-primary"
                >
                  <Plus className="h-4 w-4" />
                  <span>Tambah tim baru…</span>
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        )}
      </PopoverContent>
    </Popover>
  );
}

