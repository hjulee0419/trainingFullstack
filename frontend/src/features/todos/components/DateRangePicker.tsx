interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  errors?: { startDate?: string; endDate?: string };
}

export function DateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  errors,
}: DateRangePickerProps) {
  return (
    <div className="date-range-picker">
      <div className="date-range-picker__field">
        <label htmlFor="todo-start-date" className="date-range-picker__label">
          시작일자 *
        </label>
        <input
          id="todo-start-date"
          type="date"
          className="date-range-picker__input"
          value={startDate}
          onChange={(e) => onStartDateChange(e.target.value)}
          style={{ borderColor: errors?.startDate ? 'var(--color-danger)' : undefined }}
        />
        {errors?.startDate && <span className="date-range-picker__error">{errors.startDate}</span>}
      </div>
      <div className="date-range-picker__field">
        <label htmlFor="todo-end-date" className="date-range-picker__label">
          종료일자 *
        </label>
        <input
          id="todo-end-date"
          type="date"
          className="date-range-picker__input"
          value={endDate}
          onChange={(e) => onEndDateChange(e.target.value)}
          style={{ borderColor: errors?.endDate ? 'var(--color-danger)' : undefined }}
        />
        {errors?.endDate && <span className="date-range-picker__error">{errors.endDate}</span>}
      </div>
    </div>
  );
}
