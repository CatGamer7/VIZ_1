import { useEffect, useRef } from 'react'
import PlotlyRaw from 'plotly.js-dist-min'
import type * as PlotlyTypes from 'plotly.js'

const Plotly = PlotlyRaw as unknown as typeof PlotlyTypes

interface PlotProps {
  data: PlotlyTypes.Data[]
  layout: Partial<PlotlyTypes.Layout>
  style?: React.CSSProperties
}

export default function Plot({ data, layout, style }: PlotProps) {
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!ref.current) return
    Plotly.react(ref.current, data, layout, { responsive: true })
    return () => {
      if (ref.current) Plotly.purge(ref.current)
    }
  }, [data, layout])

  return <div ref={ref} style={style} />
}
