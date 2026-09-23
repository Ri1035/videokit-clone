import { useParams, Link } from 'react-router-dom'
import { getToolById } from '../data/tools'
import GenericToolPage from './GenericToolPage'
import { VideoConverter, StreamCopy, ExtractAudio, VideoCompress, VideoResize, AudioCompress, RemoveSubtitles } from './simple-special'
import { BatchTranscode, BatchCompress, VideoMerger, AudioMerger, ImageToVideo, ImageToGif } from './multi-file'
import { VideoTrimmer, VideoSplitter, AudioTrimmer } from './timeline'
import { VideoCrop, AddWatermark, RemoveWatermark, VideoColor, AddText, AddSubtitles } from './visual-edit'
import { VideoToGif, GifCompress } from './gif-tools'
import { ThumbnailExtract, AddBgm, Sora2Watermark } from './misc'

const SPECIAL_COMPONENTS: Record<string, React.ComponentType> = {
  'video-converter': VideoConverter,
  'stream-copy': StreamCopy,
  'extract-audio': ExtractAudio,
  'video-compress': VideoCompress,
  'video-resize': VideoResize,
  'audio-compress': AudioCompress,
  'remove-subtitles': RemoveSubtitles,
  'batch-transcode': BatchTranscode,
  'batch-compress': BatchCompress,
  'video-merger': VideoMerger,
  'audio-merger': AudioMerger,
  'image-to-video': ImageToVideo,
  'image-to-gif': ImageToGif,
  'video-trimmer': VideoTrimmer,
  'video-splitter': VideoSplitter,
  'audio-trimmer': AudioTrimmer,
  'video-crop': VideoCrop,
  'add-watermark': AddWatermark,
  'remove-watermark': RemoveWatermark,
  'video-color': VideoColor,
  'add-text': AddText,
  'add-subtitles': AddSubtitles,
  'video-to-gif': VideoToGif,
  'gif-compress': GifCompress,
  'thumbnail-extract': ThumbnailExtract,
  'add-bgm': AddBgm,
  'sora2-watermark': Sora2Watermark,
}

export default function SpecialToolPage() {
  const { id } = useParams<{ id: string }>()
  const tool = getToolById(id || '')

  if (!tool) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">工具不存在 / Tool not found</p>
        <Link to="/" className="btn-primary mt-4 inline-block">返回首页</Link>
      </div>
    )
  }

  // 通用页面
  if (tool.pageType === 'generic') {
    return <GenericToolPage />
  }

  // 特殊页面
  const Component = SPECIAL_COMPONENTS[tool.id]
  if (!Component) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">该工具正在开发中 / Under construction</p>
        <Link to="/" className="btn-primary mt-4 inline-block">返回首页</Link>
      </div>
    )
  }

  return <Component />
}
