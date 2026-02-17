import React from 'react'

interface Props {
    
}

const Loading = (props: Props) => {
    return (
        <div className="flex items-center justify-center h-96">
            <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-10 w-10 border-3 border-gray-200 border-t-cyan-600"></div>
                <div className="text-center">
                    <p className="text-sm font-medium text-gray-700">
                        Loading warehouses...
                    </p>
                </div>
            </div>
        </div>
    )
}

export default Loading