#version 310 es

#extension GL_GOOGLE_include_directive : enable

#include "constants.h"

layout(input_attachment_index = 0, set = 0, binding = 0) uniform highp subpassInput in_color;

layout(set = 0, binding = 1) uniform sampler2D color_grading_lut_texture_sampler;

layout(location = 0) out highp vec4 out_color;

void main()
{
    highp ivec2 lut_tex_size = textureSize(color_grading_lut_texture_sampler, 0);
    highp float _COLORS      = float(lut_tex_size.y);

    highp vec4 color       = subpassLoad(in_color).rgba;

    int layer_count       = lut_tex_size.x / lut_tex_size.y;
    highp float lut_tex_size_x_inv = 1.0f / float(lut_tex_size.x);

    highp float layer_pos = float(layer_count - 1) * color.b;

    highp float layer_sampler_pos_lo = float(int(layer_pos));
    highp float layer_sampler_pos_hi = layer_sampler_pos_lo + 1.0f;


    highp float x_pos_lo = (color.r + layer_sampler_pos_lo * float(layer_count)) * lut_tex_size_x_inv;
    highp float x_pos_hi = (color.r + layer_sampler_pos_hi * float(layer_count)) * lut_tex_size_x_inv;
    highp float y_pos = color.g;

    highp vec4 new_color_lo = texture(color_grading_lut_texture_sampler, vec2(x_pos_lo, y_pos));
    highp vec4 new_color_hi = texture(color_grading_lut_texture_sampler, vec2(x_pos_hi, y_pos));

    out_color = (new_color_lo + new_color_hi) * 0.5f;
}
