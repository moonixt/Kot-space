"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Tipos de dados para a tabela
export type CellType = "text" | "number" | "select";

// Color option type for select
export type SelectOption = { label: string; color: string };

export type Column = {
  id: string;
  label: string;
  type: CellType;
  options?: SelectOption[]; // Para colunas do tipo select
  width: number;
};

export type Row = {
  id: string;
  [key: string]: any;
};

export type TableData = {
  columns: Column[];
  rows: Row[];
};

// Componente para renderizar uma célula editável
function EditableCell({ 
  value: initialValue, 
  row: rowId, 
  column, 
  updateData 
}: { 
  value: any; 
  row: string; 
  column: Column; 
  updateData: (rowId: string, columnId: string, value: any) => void 
}) {
  const [value, setValue] = useState(initialValue);
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  // Formatar valor ao iniciar edição
  const startEditing = () => {
    let editValue = value;
    
    // Se for um número, garantir que seja exibido como string para edição
    if (column.type === "number" && typeof value === "number") {
      editValue = value.toString();
    }
    
    setValue(editValue);
    setIsEditing(true);
  };

  const onBlur = () => {
    setIsEditing(false);
    if (value !== initialValue) {
      // Converter o valor para o formato correto de acordo com o tipo da coluna
      let formattedValue = value;
      
      if (column.type === "number") {
        formattedValue = parseFloat(value);
        if (isNaN(formattedValue)) formattedValue = 0;
      }
      
      updateData(rowId, column.id, formattedValue);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      setIsEditing(false);
      
      if (value !== initialValue) {
        // Converter o valor para o formato correto
        let formattedValue = value;
        
        if (column.type === "number") {
          formattedValue = parseFloat(value);
          if (isNaN(formattedValue)) formattedValue = 0;
        }
        
        updateData(rowId, column.id, formattedValue);
      }
    } else if (e.key === "Escape") {
      setIsEditing(false);
      setValue(initialValue);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    
    // Validação específica para campo numérico
    if (column.type === "number") {
      // Permitir apenas números, ponto decimal e sinal negativo
      if (!/^-?\d*\.?\d*$/.test(newValue) && newValue !== "-" && newValue !== "") {
        return;
      }
    }
    
    setValue(newValue);
  };

  if (isEditing) {
    if (column.type === "select" && column.options) {
      return (
        <select
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            updateData(rowId, column.id, e.target.value);
            setIsEditing(false);
          }}
          onBlur={() => setIsEditing(false)}
          autoFocus
          className="w-full h-8 px-2 text-xs"
        >
          {column.options.map((option) => (
            <option key={option.label} value={option.label}>
              {option.label}
            </option>
          ))}
        </select>
      );
    } else {
      return (
        <textarea
          value={value}
          onChange={handleChange}
          onBlur={onBlur}
          onKeyDown={onKeyDown}
          ref={inputRef}
          className={`w-full h-8 min-h-[1.5rem] max-h-32 px-2    text-xs ${
            column.type === "number" ? "text-right" : ""
          }`}
          rows={1}
        />
      );
    }
  }

  let displayValue = value;
  
  // Formatação específica para cada tipo de dado
  if (column.type === "number") {
    // Garantir que é exibido como número
    const num = parseFloat(value);
    displayValue = !isNaN(num) ? num.toString() : "0";
  } else if (column.type === "select" && column.options) {
    // Verificar se o valor existe nas opções
    const option = column.options.find(opt => opt.label === value);
    if (!option && column.options.length > 0) {
      displayValue = column.options[0].label;
    }
  }

  return (
    <div
      className={`h-8 px-2 flex items-center cursor-pointer truncate ${
        column.type === "number" ? "justify-end" : "justify-start"
      }`}
      onClick={startEditing}
      title={String(displayValue)}
    >
      {column.type === "select" && column.options ? (
        <div className="flex items-center w-full">
          {(() => {
            const option = column.options.find(opt => opt.label === displayValue);
            return (
              <>
                {option && (
                  <span 
                    className="w-3 h-3 rounded-full mr-2" 
                    style={{ backgroundColor: option.color || '#60a5fa' }}
                  />
                )}
                <span>{displayValue}</span>
              </>
            );
          })()}
        </div>
      ) : (
        displayValue
      )}
    </div>
  );
}

// Componente para uma célula do cabeçalho
function HeaderCell({
  column,
  updateColumn,
  addColumn,
  deleteColumn,
  changeColumnType,
  isActive,
  sortDirection,
  onSort,
  onResize
}: {
  column: Column;
  updateColumn: (columnId: string, label: string) => void;
  addColumn: (columnId: string, position: "left" | "right") => void;
  deleteColumn: (columnId: string) => void;
  changeColumnType: (columnId: string) => void;
  isActive: boolean;
  sortDirection?: "asc" | "desc";
  onSort: (columnId: string) => void;
  onResize: (columnId: string, width: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(column.label);
  const [isResizing, setIsResizing] = useState(false);
  const [width, setWidth] = useState(column.width);
  const [menuOpen, setMenuOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const cellRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const initialPosRef = useRef<number>(0);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editing]);

  useEffect(() => {
    setValue(column.label);
    setWidth(column.width);
  }, [column]);

  // Fechar o menu dropdown quando clicar fora dele
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuOpen && menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

  const handleBlur = () => {
    setEditing(false);
    updateColumn(column.id, value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      setEditing(false);
      updateColumn(column.id, value);
    } else if (e.key === "Escape") {
      setEditing(false);
      setValue(column.label);
    }
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    initialPosRef.current = e.clientX;

    document.addEventListener("mousemove", handleResizeMove);
    document.addEventListener("mouseup", handleResizeEnd);
  };

  const handleResizeMove = useCallback((e: MouseEvent) => {
    if (isResizing && cellRef.current) {
      const diff = e.clientX - initialPosRef.current;
      const newWidth = Math.max(50, width + diff);
      setWidth(newWidth);
      cellRef.current.style.width = `${newWidth}px`;
    }
  }, [isResizing, width]);

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
    onResize(column.id, width);

    document.removeEventListener("mousemove", handleResizeMove);
    document.removeEventListener("mouseup", handleResizeEnd);
  }, [column.id, onResize, width, handleResizeMove]);

  useEffect(() => {
    return () => {
      document.removeEventListener("mousemove", handleResizeMove);
      document.removeEventListener("mouseup", handleResizeEnd);
    };
  }, [handleResizeMove, handleResizeEnd]);

  // Mostrar ícone de acordo com o tipo da coluna
  const getTypeIcon = () => {
    switch(column.type) {
      case "number": return "123";
      case "select": return "⊙";
      default: return "Aa";
    }
  };

  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(!menuOpen);
  };

  return (
    <div 
      ref={cellRef}
      className="flex-none p-2 relative select-none group"
      style={{ width: `${width}px`, background: "var(--table-header-bg)", color: "var(--foreground)", borderRight: "1px solid var(--table-border)" }}
    >
      <div
        className={`absolute top-0 right-0 h-full w-1 cursor-col-resize hover:bg-primary/50 ${isResizing ? 'bg-primary/80' : ''}`}
        onMouseDown={handleResizeStart}
      />
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between gap-2 mb-1">
          {editing ? (
            <input
              ref={inputRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              className="h-7 px-1 text-sm"
            />
          ) : (
            <button 
              className="h-7 px-1 hover:bg-accent flex-1 justify-start"
              onClick={() => onSort(column.id)}
            >
              <span className="truncate font-medium">{column.label}</span>
              {isActive && (
                <span className="ml-1">
                  {sortDirection === "asc" ? "▲" : "▼"}
                </span>
              )}
              {!isActive && (
                <span className="ml-1 text-muted-foreground/70">⇅</span>
              )}
            </button>
          )}
          <div className="relative">
            <button
              onClick={toggleMenu}
              className="h-7 w-7 p-0 cursor-pointer flex items-center justify-center bg-transparent border-none hover:bg-gray-100 rounded"
            >
              ⋮
            </button>
            {menuOpen && (
              <div 
                ref={menuRef}
                className="absolute right-0 z-10 mt-1 w-40 bg-[var(--foreground)] text-[var(--background)] border border-gray-200 rounded shadow-md flex flex-col text-xs"
              >
                <button onClick={() => { setEditing(true); setMenuOpen(false); }} className="px-3 py-2  ">Renomear coluna</button>
                <button onClick={() => { changeColumnType(column.id); setMenuOpen(false); }} className="px-3 py-2 ">Alterar tipo de dados</button>
                <hr className="my-1" />
                <button onClick={() => { addColumn(column.id, "left"); setMenuOpen(false); }} className="px-3 py-2  ">Adicionar coluna à esquerda</button>
                <button onClick={() => { addColumn(column.id, "right"); setMenuOpen(false); }} className="px-3 py-2 ">Adicionar coluna à direita</button>
                <hr className="my-1" />
                <button onClick={() => { deleteColumn(column.id); setMenuOpen(false); }} className="px-3 py-2 text-red-600 ">Deletar coluna</button>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center text-xs text-muted-foreground">
          <span className="bg-muted px-1 py-0.5 rounded mr-1">{getTypeIcon()}</span>
          {column.type === "select" ? "Seleção" : column.type === "number" ? "Número" : "Texto"}
        </div>
      </div>
    </div>
  );
}

// Componente para o cabeçalho da tabela
function TableHeader({
  columns,
  updateColumn,
  addColumn,
  deleteColumn,
  changeColumnType,
  activeSort,
  sortData,
  resizeColumn
}: {
  columns: Column[];
  updateColumn: (columnId: string, label: string) => void;
  addColumn: (columnId: string, position: "left" | "right") => void;
  deleteColumn: (columnId: string) => void;
  changeColumnType: (columnId: string) => void;
  activeSort: { columnId: string; direction: "asc" | "desc" } | null;
  sortData: (columnId: string) => void;
  resizeColumn: (columnId: string, width: number) => void;
}) {
  return (
    <div className="flex border-bbg-[var(--table-header-bg)]" style={{ borderColor: "var(--table-border)" }}>
      {columns.map((column) => (
        <HeaderCell
          key={column.id}
          column={column}
          updateColumn={updateColumn}
          addColumn={addColumn}
          deleteColumn={deleteColumn}
          changeColumnType={changeColumnType}
          isActive={activeSort?.columnId === column.id}
          sortDirection={activeSort?.direction}
          onSort={sortData}
          onResize={resizeColumn}
        />
      ))}
    </div>
  );
}

// Componente principal da tabela
export default function DataTable({ tableName = "" }: { tableName?: string }) {
  const [data, setData] = useState<TableData>({
    columns: [],
    rows: []
  });
  const [loading, setLoading] = useState(true);
  const [activeSort, setActiveSort] = useState<{
    columnId: string;
    direction: "asc" | "desc";
  } | null>(null);
  const [columnDialog, setColumnDialog] = useState<{
    open: boolean;
    columnId?: string;
    columnType: CellType;
    options: SelectOption[];
    newOptionText: string;
  }>({
    open: false,
    columnType: "text",
    options: [],
    newOptionText: ""
  });
  
  const fetchData = async () => {
    setLoading(true);
    try {
      // First, check if table definition exists, create if not
      const { data: tableDefinition, error: tableDefError } = await supabase.rpc(
        'get_table_columns',
        { p_table_name: tableName, p_user_id: (await supabase.auth.getUser()).data.user?.id }
      );

      let columns: Column[] = [];
      
      if (tableDefinition && tableDefinition.length > 0) {
        // Map the columns from the database structure
        columns = tableDefinition.map((col: any) => {
          // Fix for options - ensure it's always an array of SelectOption objects
          let options: any[] = [];
          
          try {
            if (col.options) {
              // If options is a string, parse it
              if (typeof col.options === 'string') {
                options = JSON.parse(col.options);
              } 
              // If it's already an object but not an array, wrap it in array
              else if (typeof col.options === 'object' && !Array.isArray(col.options)) {
                options = [col.options];
              }
              // If it's already an array, use it directly
              else if (Array.isArray(col.options)) {
                options = col.options;
              }
              
              // Ensure each option has label and color properties
              if (Array.isArray(options)) {
                options = options.map(opt => {
                  if (typeof opt === 'string') {
                    return { label: opt, color: '#60a5fa' };
                  }
                  return {
                    label: opt.label || "Option",
                    color: opt.color || '#60a5fa'
                  };
                });
              } else {
                options = [];
              }
            } else {
              options = [];
            }
          } catch (e) {
            console.error("Error parsing column options:", e);
            options = [];
          }

          return {
            id: col.column_id,
            label: col.label,
            type: col.type as CellType,
            options: options,
            width: col.width
          };
        });
      } else {
        // Create default columns if none exist
        const columns = [
          { id: "col1", label: "Books", type: "text", width: 200 },
          { id: "col2", label: "description", type: "text", width: 200 },
          { id: "col3", label: "Status", type: "select", options: [
            { label: "Pending", color: '#f59e42' },
            { label: "In progress", color: '#60a5fa' },
            { label: "Completed", color: '#22c55e' }
          ], width: 150 }
        ];
        
        // Create a new table definition
        const { data: newTableDef, error: tableCreateError } = await supabase
          .from("table_definitions")
          .insert({
            table_name: tableName,
            user_id: (await supabase.auth.getUser()).data.user?.id
          })
          .select('id')
          .single();
          
        if (tableCreateError) {
          throw tableCreateError;
        }
        
        // Insert the default columns
        const columnsToInsert = columns.map((col, index) => ({
          table_id: newTableDef.id,
          column_id: col.id,
          label: col.label,
          type: col.type,
          width: col.width,
          options: col.options ? JSON.stringify(col.options) : null,
          position: index
        }));
        
        const { error: columnsError } = await supabase
          .from("table_columns")
          .insert(columnsToInsert);
          
        if (columnsError) {
          throw columnsError;
        }
      }

      // Get all rows from the datatable
      const { data: rows, error: rowsError } = await supabase
        .from("datatable")
        .select("id, data")
        .eq("table_name", tableName);

      if (rowsError) {
        throw rowsError;
      }

      const formattedRows = rows?.map(row => ({
        id: row.id,
        ...row.data
      })) || [];

      setData({
        columns,
        rows: formattedRows
      });
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast.error("Não foi possível carregar os dados da tabela");
    } finally {
      setLoading(false);
    }
  };

  const saveMetadata = async (columns: Column[]) => {
    try {
      // Get the table definition ID
      const { data: tableDefinition, error: tableDefError } = await supabase
        .from("table_definitions")
        .select("id")
        .eq("table_name", tableName)
        .single();
      
      if (tableDefError) {
        throw tableDefError;
      }
      
      // First delete existing columns for this table
      const { error: deleteError } = await supabase
        .from("table_columns")
        .delete()
        .eq("table_id", tableDefinition.id);
      
      if (deleteError) {
        throw deleteError;
      }
      
      // Insert all columns with their positions
      const columnsToInsert = columns.map((col, index) => ({
        table_id: tableDefinition.id,
        column_id: col.id,
        label: col.label,
        type: col.type,
        width: col.width || 150,
        options: col.options ? JSON.stringify(col.options) : null, // Make sure options are stringified
        position: index
      }));
      
      const { error: insertError } = await supabase
        .from("table_columns")
        .insert(columnsToInsert);
      
      if (insertError) {
        throw insertError;
      }
      
      console.log("Columns saved successfully", { columns });
    } catch (error) {
      console.error("Erro ao salvar metadados:", error);
      toast.error("Não foi possível salvar as configurações da tabela");
      throw error;
    }
  };

  const updateData = async (rowId: string, columnId: string, value: any) => {
    try {
      const row = data.rows.find(r => r.id === rowId);
      if (!row) return;

      const updatedData = {
        ...Object.fromEntries(
          data.columns.map(col => [col.id, row[col.id] !== undefined ? row[col.id] : ""])
        ),
        [columnId]: value
      };

      const { error } = await supabase
        .from("datatable")
        .update({ data: updatedData })
        .eq("id", rowId);

      if (error) throw error;

      setData(prev => ({
        ...prev,
        rows: prev.rows.map(r => 
          r.id === rowId ? { ...r, [columnId]: value } : r
        )
      }));
      
      toast.success("Alteração salva", {
        duration: 1500,
        position: "bottom-right",
        className: "bg-primary text-primary-foreground"
      });
    } catch (error) {
      console.error("Erro ao atualizar dados:", error);
      toast.error("Não foi possível atualizar a célula");
    }
  };

  const addRow = async () => {
    try {
      const newRowData = Object.fromEntries(
        data.columns.map(column => [
          column.id, 
          column.type === "number" ? 0 : 
          column.type === "select" && column.options?.length ? column.options[0].label : ""
        ])
      );

      const { data: insertedRow, error } = await supabase
        .from("datatable")
        .insert({
          table_name: tableName,
          data: newRowData
        })
        .select("id")
        .single();

      if (error) throw error;

      setData(prev => ({
        ...prev,
        rows: [
          {
            id: insertedRow.id,
            ...newRowData
          },
          ...prev.rows
        ]
      }));

      toast.success("Nova linha adicionada");
    } catch (error) {
      console.error("Erro ao adicionar linha:", error);
      toast.error("Não foi possível adicionar uma nova linha");
    }
  };

  const updateColumn = async (columnId: string, label: string) => {
    try {
      const updatedColumns = data.columns.map(col => 
        col.id === columnId ? { ...col, label } : col
      );
      
      await saveMetadata(updatedColumns);
      
      setData(prev => ({
        ...prev,
        columns: updatedColumns
      }));
    } catch (error) {
      console.error("Erro ao atualizar coluna:", error);
      toast.error("Não foi possível atualizar a coluna");
    }
  };

  const resizeColumn = async (columnId: string, width: number) => {
    try {
      const updatedColumns = data.columns.map(col => 
        col.id === columnId ? { ...col, width } : col
      );
      
      await saveMetadata(updatedColumns);
      
      setData(prev => ({
        ...prev,
        columns: updatedColumns
      }));
    } catch (error) {
      console.error("Erro ao redimensionar coluna:", error);
    }
  };

  const addColumn = async (adjacentColumnId: string, position: "left" | "right") => {
    try {
      const columnIndex = data.columns.findIndex(col => col.id === adjacentColumnId);
      if (columnIndex === -1) return;
      
      const newColumnId = `col${Date.now()}`;
      
      const newColumn: Column = {
        id: newColumnId,
        label: "Nova Coluna",
        type: "text",
        width: 150
      };
      
      const newColumns = [...data.columns];
      newColumns.splice(
        position === "left" ? columnIndex : columnIndex + 1,
        0,
        newColumn
      );
      
      const updatedRows = data.rows.map(row => ({
        ...row,
        [newColumnId]: ""
      }));
      
      await saveMetadata(newColumns);

      for (const row of updatedRows) {
        const rowData = Object.fromEntries(
          newColumns.map(col => [col.id, row[col.id] !== undefined ? row[col.id] : ""])
        );
        
        await supabase
          .from("datatable")
          .update({ data: rowData })
          .eq("id", row.id);
      }
      
      setData(prev => ({
        columns: newColumns,
        rows: updatedRows
      }));
      
      toast.success("Nova coluna adicionada");
    } catch (error) {
      console.error("Erro ao adicionar coluna:", error);
      toast.error("Não foi possível adicionar a coluna");
    }
  };

  const addColumnToEnd = async () => {
    try {
      const newColumnId = `col${Date.now()}`;
      
      const newColumn: Column = {
        id: newColumnId,
        label: "Nova Coluna",
        type: "text",
        width: 150
      };
      
      const newColumns = [...data.columns, newColumn];
      
      const updatedRows = data.rows.map(row => ({
        ...row,
        [newColumnId]: ""
      }));
      
      await saveMetadata(newColumns);
      
      for (const row of updatedRows) {
        const rowData = Object.fromEntries(
          newColumns.map(col => [col.id, row[col.id] !== undefined ? row[col.id] : ""])
        );
        
        await supabase
          .from("datatable")
          .update({ data: rowData })
          .eq("id", row.id);
      }
      
      setData(prev => ({
        columns: newColumns,
        rows: updatedRows
      }));
      
      toast.success("Nova coluna adicionada");
    } catch (error) {
      console.error("Erro ao adicionar coluna:", error);
      toast.error("Não foi possível adicionar a coluna");
    }
  };

  const deleteColumn = async (columnId: string) => {
    try {
      if (data.columns.length <= 1) {
        toast.error("Não é possível remover a última coluna");
        return;
      }
      
      const newColumns = data.columns.filter(col => col.id !== columnId);
      
      const updatedRows = data.rows.map(row => {
        const newRow = { ...row };
        delete newRow[columnId];
        return newRow;
      });
      
      await saveMetadata(newColumns);
      
      for (const row of updatedRows) {
        const rowData = Object.fromEntries(
          newColumns.map(col => [col.id, row[col.id] !== undefined ? row[col.id] : ""])
        );
        
        await supabase
          .from("datatable")
          .update({ data: rowData })
          .eq("id", row.id);
      }
      
      setData(prev => ({
        columns: newColumns,
        rows: updatedRows
      }));
      
      toast.success("Coluna removida");
    } catch (error) {
      console.error("Erro ao remover coluna:", error);
      toast.error("Não foi possível remover a coluna");
    }
  };

  const deleteRow = async (rowId: string) => {
    try {
      const { error } = await supabase
        .from("datatable")
        .delete()
        .eq("id", rowId);

      if (error) throw error;

      setData(prev => ({
        ...prev,
        rows: prev.rows.filter(r => r.id !== rowId)
      }));
      
      toast.success("Linha removida");
    } catch (error) {
      console.error("Erro ao remover linha:", error);
      toast.error("Não foi possível remover a linha");
    }
  };

  const changeColumnType = (columnId: string) => {
    try {
      const column = data.columns.find(col => col.id === columnId);
      if (!column) return;

      setColumnDialog({
        open: true,
        columnId,
        columnType: column.type,
        options: column.options || [],
        newOptionText: ""
      });
    } catch (error) {
      console.error("Erro ao alterar tipo de coluna:", error);
      toast.error("Não foi possível alterar o tipo da coluna");
    }
  };

  const saveColumnTypeChanges = async () => {
    try {
      if (!columnDialog.columnId) return;

      const oldColumn = data.columns.find(col => col.id === columnDialog.columnId);
      if (!oldColumn) return;
      
      const oldType = oldColumn.type;
      const newType = columnDialog.columnType;
      
      // Atualizar a definição da coluna
      const updatedColumns = data.columns.map(col => 
        col.id === columnDialog.columnId 
          ? { 
              ...col, 
              type: newType,
              options: newType === "select" ? columnDialog.options : undefined
            } 
          : col
      );
      
      // Se o tipo mudou, precisamos converter os dados em todas as linhas
      if (oldType !== newType) {
        const updatedRows = [...data.rows];
        
        for (let i = 0; i < updatedRows.length; i++) {
          const row = updatedRows[i];
          const oldValue = row[columnDialog.columnId];
          let newValue;
          
          // Converter o valor com base no novo tipo
          if (newType === "number") {
            // Converter para número
            const parsedValue = parseFloat(oldValue);
            newValue = isNaN(parsedValue) ? 0 : parsedValue;
          } 
          else if (newType === "select") {
            // Converter para uma opção de seleção válida
            const isValidOption = columnDialog.options.some(opt => opt.label === oldValue);
            newValue = isValidOption ? oldValue : 
              (columnDialog.options.length > 0 ? columnDialog.options[0].label : "");
          }
          else {
            // Converter para texto
            newValue = oldValue !== null && oldValue !== undefined ? String(oldValue) : "";
          }
          
          // Atualizar o valor na linha
          updatedRows[i] = {
            ...row,
            [columnDialog.columnId]: newValue
          };
          
          // Atualizar no banco de dados
          const updatedData = {
            ...Object.fromEntries(
              updatedColumns.map(col => [col.id, updatedRows[i][col.id] !== undefined ? updatedRows[i][col.id] : ""])
            )
          };
          
          await supabase
            .from("datatable")
            .update({ data: updatedData })
            .eq("id", row.id);
        }
        
        // Atualizar os dados locais
        setData({
          columns: updatedColumns,
          rows: updatedRows
        });
      } else {
        // Se o tipo não mudou, apenas atualize as definições da coluna
        await saveMetadata(updatedColumns);
        
        setData(prev => ({
          ...prev,
          columns: updatedColumns
        }));
      }
      
      // Sempre salvar os metadados para garantir que as opções sejam atualizadas
      await saveMetadata(updatedColumns);
      
      setColumnDialog(prev => ({ ...prev, open: false }));
      toast.success("Tipo de coluna alterado com sucesso");
    } catch (error) {
      console.error("Erro ao salvar tipo de coluna:", error);
      toast.error("Não foi possível salvar o tipo da coluna");
    }
  };

  const sortData = (columnId: string) => {
    let direction: "asc" | "desc" = "asc";
    
    if (activeSort?.columnId === columnId) {
      if (activeSort.direction === "asc") {
        direction = "desc";
      } else {
        setActiveSort(null);
        setData(prev => ({
          ...prev,
          rows: [...prev.rows].sort((a, b) => {
            return a.id.localeCompare(b.id);
          })
        }));
        return;
      }
    }
    
    setActiveSort({ columnId, direction });
    
    setData(prev => {
      const column = prev.columns.find(col => col.id === columnId);
      if (!column) return prev;
      
      const sortedRows = [...prev.rows].sort((a, b) => {
        const aVal = a[columnId];
        const bVal = b[columnId];
        
        if (column.type === "number") {
          return direction === "asc" 
            ? Number(aVal || 0) - Number(bVal || 0)
            : Number(bVal || 0) - Number(aVal || 0);
        }
        
        if (aVal === bVal) return 0;
        if (aVal === undefined || aVal === null) return direction === "asc" ? -1 : 1;
        if (bVal === undefined || bVal === null) return direction === "asc" ? 1 : -1;
        
        return direction === "asc"
          ? String(aVal).localeCompare(String(bVal))
          : String(bVal).localeCompare(String(aVal));
      });
      
      return { ...prev, rows: sortedRows };
    });
  };

  useEffect(() => {
    fetchData();
  }, [tableName]);

  const addOption = () => {
    if (!columnDialog.newOptionText.trim()) return;
    setColumnDialog(prev => ({
      ...prev,
      options: [
        ...prev.options,
        { label: prev.newOptionText.trim(), color: '#60a5fa' }
      ],
      newOptionText: ""
    }));
  };
  
  const removeOption = (option: SelectOption) => {
    setColumnDialog(prev => ({
      ...prev,
      options: prev.options.filter(o => o.label !== option.label)
    }));
  };

  return (
    <div className="w-full grid justify-center ">
      <div className="flex justify-start items-center mb-4">
        <h2 className="text-lg font-medium">{tableName}</h2>
        <div className="flex gap-2">
          <button
            onClick={addRow}
            className="bg-[var(--foreground)] text-[var(--background)] border border-[var(--table-border)] text-xs h-6 px-2 rounded"
          >
            + Nova Linha
          </button>
          <button
            onClick={addColumnToEnd}
            className="bg-[var(--foreground)] text-[var(--background)] border border-[var(--table-border)] text-xs h-6 px-2 rounded"
          >
            + Nova Coluna
          </button>
        </div>
      </div>

      {loading ? (
        <div className="w-full h-64 flex items-center justify-center">
          <div className="text-muted-foreground">Carregando...</div>
        </div>
      ) : (
        <div className="border overflow-x-auto text-xs" style={{ borderColor: "var(--container)", background: "var(--background)" }}>
          <TableHeader 
            columns={data.columns}
            updateColumn={updateColumn}
            addColumn={addColumn}
            deleteColumn={deleteColumn}
            changeColumnType={changeColumnType}
            activeSort={activeSort}
            sortData={sortData}
            resizeColumn={resizeColumn}
          />
          <div className="divide-y">
            {data.rows.length > 0 ? (
              data.rows.map((row) => (
                <div key={row.id} className="flex hover:bg-muted/50 text-xs min-h-[1.5rem] w-fit">
                  {data.columns.map((column) => (
                    <div 
                      key={`${row.id}-${column.id}`}
                      className="flex-none p-1 relative min-h-[1.5rem] border"
                      style={{ width: `${column.width}px` }}
                    >
                      <EditableCell
                        value={row[column.id] !== undefined ? row[column.id] : ""}
                        row={row.id}
                        column={column}
                        updateData={updateData}
                      />
                    </div>
                  ))}
                  <div className="flex-none p-1 min-h-[1.5rem] w-auto">
                    <button
                      onClick={() => deleteRow(row.id)}
                      className="h-6 w-6 p-0 text-xs bg-transparent border-none cursor-pointer"
                      title="Deletar linha"
                    >
                      ❌
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-xs">
                <p className="text-muted-foreground mb-2">Nenhum dado encontrado</p>
                <button
                  onClick={addRow}
                  className="bg-[var(--foreground)] text-[var(--background)] border border-[var(--table-border)] text-xs h-6 px-2 rounded"
                >
                  + Adicionar Primeira Linha
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {columnDialog.open && (
        <dialog 
          open 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 w-f
      ull h-full p-4"
          onClick={(e) => {
            // Fechar modal ao clicar fora dele
            if (e.target === e.currentTarget) {
        
      setColumnDialog(prev => ({ ...prev, open: false }));
            }
          }}
        >
          <div 
            className="bg-[
var(--foreground)] rounded-lg shadow-lg p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-4">Alterar Tipo de Dados</h3>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label htmlFor="column-type" className="text-sm font-medium">
                  Tipo de Coluna
                </label>
                <select
                  id="column-type"
                  value={columnDialog.columnType}
                  onChange={(e) => setColumnDialog(prev => ({ ...prev, columnType: e.target.value as CellType }))}
                  className="w-full border border-input  px-3 py-2 text-sm"
                >
                  <option value="text">Texto</option>
                  <option value="number">Número</option>
                  <option value="select">Seleção</option>
                </select>
              </div>

              {columnDialog.columnType === "select" && (
                <div className="grid gap-2">
                  <label htmlFor="select-options" className="text-sm font-medium">
                    Opções de Seleção
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="select-options"
                      value={columnDialog.newOptionText}
                      onChange={(e) => setColumnDialog(prev => ({ ...prev, newOptionText: e.target.value }))}
                      placeholder="Adicionar opção..."
                      className="flex-1 border border-input rounded-md px-3 py-2 text-sm"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addOption();
                        }
                      }}
                    />
                    <button 
                      type="button" 
                      onClick={addOption}
                      className="bg-primary text-primary-foreground py-2 px-3 rounded-md text-sm"
                    >
                      Adicionar
                    </button>
                  </div>
                  {columnDialog.options.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      Adicione pelo menos uma opção para este tipo de coluna.
                    </p>
                  )}
                  <div className="mt-2 max-h-[200px] overflow-auto border border-muted rounded-md bg-muted/30 p-1">
                    <ul className="space-y-1">
                      {columnDialog.options.map((option, idx) => (
                        <li key={option.label} className="flex items-center justify-between bg-background p-2 rounded-md gap-2">
                          <span className="flex items-center gap-2">
                            <span style={{
                              display: 'inline-block',
                              width: 16,
                              height: 16,
                              borderRadius: '50%',
                              background: option.color,
                              border: '1px solid #ccc',
                            }} />
                            {option.label}
                          </span>
                          <div className="flex items-center gap-1">
                            <input
                              type="color"
                              value={option.color}
                              onChange={e => {
                                const newColor = e.target.value;
                                setColumnDialog(prev => ({
                                  ...prev,
                                  options: prev.options.map((o, i) => i === idx ? { ...o, color: newColor } : o)
                                }));
                              }}
                              className="w-6 h-6 border rounded cursor-pointer"
                              title="Escolher cor"
                            />
                            <button
                              onClick={() => removeOption(option)}
                              className="h-6 w-6 flex items-center justify-center rounded hover:bg-muted"
                              aria-label="Remover opção"
                            >
                              ✖
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 mt-4 pt-2 border-t">
              <button 
                onClick={() => setColumnDialog(prev => ({ ...prev, open: false }))}
                className="px-4 py-2 border rounded-md hover:bg-muted"
              >
                Cancelar
              </button>
              <button 
                onClick={saveColumnTypeChanges}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                Salvar Alterações
              </button>
            </div>
          </div>
        </dialog>
      )}
    </div>
  );
}
