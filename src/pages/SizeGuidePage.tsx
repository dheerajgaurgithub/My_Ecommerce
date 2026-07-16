import { Ruler, Shirt, Footprints } from 'lucide-react';

export function SizeGuidePage() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="mb-8">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-white mb-2">Size Guide</h1>
        <p className="text-neutral-600 dark:text-neutral-400">Find your perfect fit with our comprehensive size charts</p>
      </div>

      <div className="space-y-8">
        <div className="card p-6">
          <h2 className="font-semibold text-xl text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
            <Shirt size={24} className="text-brand-600" /> Tops (Shirts, T-Shirts, Kurtas)
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-700">
                  <th className="text-left py-3 px-4 text-neutral-900 dark:text-white font-medium">Size</th>
                  <th className="text-center py-3 px-4 text-neutral-900 dark:text-white font-medium">Chest (in)</th>
                  <th className="text-center py-3 px-4 text-neutral-900 dark:text-white font-medium">Length (in)</th>
                  <th className="text-center py-3 px-4 text-neutral-900 dark:text-white font-medium">Shoulder (in)</th>
                </tr>
              </thead>
              <tbody className="text-neutral-700 dark:text-neutral-300">
                <tr className="border-b border-neutral-100 dark:border-neutral-800">
                  <td className="py-3 px-4 font-medium">XS</td>
                  <td className="text-center py-3 px-4">36-38</td>
                  <td className="text-center py-3 px-4">26</td>
                  <td className="text-center py-3 px-4">16</td>
                </tr>
                <tr className="border-b border-neutral-100 dark:border-neutral-800">
                  <td className="py-3 px-4 font-medium">S</td>
                  <td className="text-center py-3 px-4">38-40</td>
                  <td className="text-center py-3 px-4">27</td>
                  <td className="text-center py-3 px-4">17</td>
                </tr>
                <tr className="border-b border-neutral-100 dark:border-neutral-800">
                  <td className="py-3 px-4 font-medium">M</td>
                  <td className="text-center py-3 px-4">40-42</td>
                  <td className="text-center py-3 px-4">28</td>
                  <td className="text-center py-3 px-4">18</td>
                </tr>
                <tr className="border-b border-neutral-100 dark:border-neutral-800">
                  <td className="py-3 px-4 font-medium">L</td>
                  <td className="text-center py-3 px-4">42-44</td>
                  <td className="text-center py-3 px-4">29</td>
                  <td className="text-center py-3 px-4">19</td>
                </tr>
                <tr className="border-b border-neutral-100 dark:border-neutral-800">
                  <td className="py-3 px-4 font-medium">XL</td>
                  <td className="text-center py-3 px-4">44-46</td>
                  <td className="text-center py-3 px-4">30</td>
                  <td className="text-center py-3 px-4">20</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium">XXL</td>
                  <td className="text-center py-3 px-4">46-48</td>
                  <td className="text-center py-3 px-4">31</td>
                  <td className="text-center py-3 px-4">21</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="font-semibold text-xl text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="text-brand-600">👖</span> Bottoms (Jeans, Trousers, Shorts)
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-700">
                  <th className="text-left py-3 px-4 text-neutral-900 dark:text-white font-medium">Size</th>
                  <th className="text-center py-3 px-4 text-neutral-900 dark:text-white font-medium">Waist (in)</th>
                  <th className="text-center py-3 px-4 text-neutral-900 dark:text-white font-medium">Hip (in)</th>
                  <th className="text-center py-3 px-4 text-neutral-900 dark:text-white font-medium">Length (in)</th>
                </tr>
              </thead>
              <tbody className="text-neutral-700 dark:text-neutral-300">
                <tr className="border-b border-neutral-100 dark:border-neutral-800">
                  <td className="py-3 px-4 font-medium">28</td>
                  <td className="text-center py-3 px-4">28</td>
                  <td className="text-center py-3 px-4">36</td>
                  <td className="text-center py-3 px-4">40</td>
                </tr>
                <tr className="border-b border-neutral-100 dark:border-neutral-800">
                  <td className="py-3 px-4 font-medium">30</td>
                  <td className="text-center py-3 px-4">30</td>
                  <td className="text-center py-3 px-4">38</td>
                  <td className="text-center py-3 px-4">41</td>
                </tr>
                <tr className="border-b border-neutral-100 dark:border-neutral-800">
                  <td className="py-3 px-4 font-medium">32</td>
                  <td className="text-center py-3 px-4">32</td>
                  <td className="text-center py-3 px-4">40</td>
                  <td className="text-center py-3 px-4">42</td>
                </tr>
                <tr className="border-b border-neutral-100 dark:border-neutral-800">
                  <td className="py-3 px-4 font-medium">34</td>
                  <td className="text-center py-3 px-4">34</td>
                  <td className="text-center py-3 px-4">42</td>
                  <td className="text-center py-3 px-4">43</td>
                </tr>
                <tr className="border-b border-neutral-100 dark:border-neutral-800">
                  <td className="py-3 px-4 font-medium">36</td>
                  <td className="text-center py-3 px-4">36</td>
                  <td className="text-center py-3 px-4">44</td>
                  <td className="text-center py-3 px-4">44</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium">38</td>
                  <td className="text-center py-3 px-4">38</td>
                  <td className="text-center py-3 px-4">46</td>
                  <td className="text-center py-3 px-4">45</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="font-semibold text-xl text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
            <Footprints size={24} className="text-brand-600" /> Footwear
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-700">
                  <th className="text-left py-3 px-4 text-neutral-900 dark:text-white font-medium">UK Size</th>
                  <th className="text-center py-3 px-4 text-neutral-900 dark:text-white font-medium">EU Size</th>
                  <th className="text-center py-3 px-4 text-neutral-900 dark:text-white font-medium">US Size</th>
                  <th className="text-center py-3 px-4 text-neutral-900 dark:text-white font-medium">Foot Length (cm)</th>
                </tr>
              </thead>
              <tbody className="text-neutral-700 dark:text-neutral-300">
                <tr className="border-b border-neutral-100 dark:border-neutral-800">
                  <td className="py-3 px-4 font-medium">6</td>
                  <td className="text-center py-3 px-4">39</td>
                  <td className="text-center py-3 px-4">7</td>
                  <td className="text-center py-3 px-4">24.1</td>
                </tr>
                <tr className="border-b border-neutral-100 dark:border-neutral-800">
                  <td className="py-3 px-4 font-medium">7</td>
                  <td className="text-center py-3 px-4">40</td>
                  <td className="text-center py-3 px-4">8</td>
                  <td className="text-center py-3 px-4">25.1</td>
                </tr>
                <tr className="border-b border-neutral-100 dark:border-neutral-800">
                  <td className="py-3 px-4 font-medium">8</td>
                  <td className="text-center py-3 px-4">41</td>
                  <td className="text-center py-3 px-4">9</td>
                  <td className="text-center py-3 px-4">25.8</td>
                </tr>
                <tr className="border-b border-neutral-100 dark:border-neutral-800">
                  <td className="py-3 px-4 font-medium">9</td>
                  <td className="text-center py-3 px-4">42</td>
                  <td className="text-center py-3 px-4">10</td>
                  <td className="text-center py-3 px-4">26.7</td>
                </tr>
                <tr className="border-b border-neutral-100 dark:border-neutral-800">
                  <td className="py-3 px-4 font-medium">10</td>
                  <td className="text-center py-3 px-4">43</td>
                  <td className="text-center py-3 px-4">11</td>
                  <td className="text-center py-3 px-4">27.3</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium">11</td>
                  <td className="text-center py-3 px-4">44</td>
                  <td className="text-center py-3 px-4">12</td>
                  <td className="text-center py-3 px-4">28.1</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="font-semibold text-xl text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
            <Ruler size={24} className="text-brand-600" /> How to Measure
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-medium text-neutral-900 dark:text-white">For Tops</h3>
              <ul className="list-disc list-inside space-y-2 text-neutral-700 dark:text-neutral-300 ml-2">
                <li><strong>Chest:</strong> Measure around the fullest part of your chest</li>
                <li><strong>Length:</strong> Measure from shoulder to desired length</li>
                <li><strong>Shoulder:</strong> Measure from shoulder point to shoulder point</li>
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="font-medium text-neutral-900 dark:text-white">For Bottoms</h3>
              <ul className="list-disc list-inside space-y-2 text-neutral-700 dark:text-neutral-300 ml-2">
                <li><strong>Waist:</strong> Measure around your natural waistline</li>
                <li><strong>Hip:</strong> Measure around the fullest part of your hips</li>
                <li><strong>Length:</strong> Measure from waist to desired length</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="card p-6 bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800">
          <h2 className="font-semibold text-xl text-brand-900 dark:text-brand-100 mb-4">Tips for Perfect Fit</h2>
          <ul className="list-disc list-inside space-y-2 text-brand-800 dark:text-brand-200 ml-2">
            <li>If you're between sizes, order the larger size for comfort</li>
            <li>Measure yourself wearing light clothing for accurate results</li>
            <li>Keep the measuring tape snug but not tight</li>
            <li>Compare your measurements with our size chart before ordering</li>
            <li>Different brands may have slight variations in sizing</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
