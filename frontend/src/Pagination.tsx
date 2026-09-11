interface PaginationProps {
  page: number
  totalPages: number
  hasPrev: boolean
  hasNext: boolean
  loading: boolean
  onPrev: () => void
  onNext: () => void
}

export default function Pagination({
  page,
  totalPages,
  hasPrev,
  hasNext,
  loading,
  onPrev,
  onNext,
}: PaginationProps) {
  return (
    <div className="d-flex justify-content-center align-items-center gap-2 my-3">
      <button
        className="btn btn-outline-secondary"
        onClick={onPrev}
        disabled={!hasPrev || loading}
      >
        ← Prev
      </button>
      <span className="text-body-secondary">
        Page <strong>{page}</strong> of <strong>{totalPages}</strong>
      </span>
      <button
        className="btn btn-outline-secondary"
        onClick={onNext}
        disabled={!hasNext || loading}
      >
        Next →
      </button>
    </div>
  )
}
