/**
 * [INPUT]: 依赖 vitest 与 @testing-library/react，依赖 ./platform-model-select 与平台模型可视化选项结构
 * [OUTPUT]: 对外提供 PlatformModelSelect 组件回归测试，覆盖 provider:model 复合值的选中与回调契约
 * [POS]: components/shared 的共享选择器单测，防止平台模型下拉再次出现“可展开但不可切换”的协议回退
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { PlatformModelSelect } from './platform-model-select'

describe('PlatformModelSelect', () => {
  it('uses selectionValue for current value and emitted value', async () => {
    const handleChange = vi.fn()

    render(
      <PlatformModelSelect
        value="comfly:gpt-image-2-all"
        onValueChange={handleChange}
        options={[
          {
            selectionValue: 'comfly:gpt-image-2-all',
            value: 'gpt-image-2-all',
            label: 'GPT Image 2',
            provider: 'comfly',
            providerLabel: 'Comfly',
            logoName: 'image',
            logoClassName: 'bg-slate-200 text-slate-700',
            description: 'Comfly',
          },
          {
            selectionValue: 'comfly:nano-banana',
            value: 'nano-banana',
            label: 'Nano Banana',
            provider: 'comfly',
            providerLabel: 'Comfly',
            logoName: 'image',
            logoClassName: 'bg-amber-100 text-amber-900',
            description: 'Comfly',
          },
        ]}
      />,
    )

    expect(screen.getByRole('button')).toHaveTextContent('GPT Image 2')

    fireEvent.pointerDown(screen.getByRole('button'))
    fireEvent.click(await screen.findByText('Nano Banana'))

    expect(handleChange).toHaveBeenCalledWith('comfly:nano-banana')
  })
})
