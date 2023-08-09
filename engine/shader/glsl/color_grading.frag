#version 310 es

#extension GL_GOOGLE_include_directive : enable

#include "constants.h"

layout(input_attachment_index = 0, set = 0, binding = 0) uniform highp subpassInput in_color;

layout(set = 0, binding = 1) uniform sampler2D color_grading_lut_texture_sampler;

layout(location = 0) out highp vec4 out_color;

highp vec2 getSamplePos(highp float p)
{
    highp float pp  = float(int(p + 0.5f));
    highp vec2  pos = vec2((pp - 0.5f), (pp + 0.5f));
    return pos;
}

highp vec2 calculateUV(highp float x,
                       highp float y,
                       highp float z,
                       highp float lut_tex_size_x_inv,
                       highp float lut_tex_size_y_inv,
                       highp float layer_count)
{
    highp vec2 uv = vec2(0.0f, y * lut_tex_size_y_inv);
    uv.x = (x * lut_tex_size_y_inv + z * layer_count) * lut_tex_size_x_inv;
    return uv;
}

void main()
{
    highp ivec2 lut_tex_size = textureSize(color_grading_lut_texture_sampler, 0);
    highp float _COLORS      = float(lut_tex_size.y);

    highp vec4 color = subpassLoad(in_color).rgba;

    int layer_count = lut_tex_size.x / lut_tex_size.y;

    highp float lut_tex_size_x_inv = 1.0f / float(lut_tex_size.x);

    highp float edge_length  = float(lut_tex_size.y - 1);
    highp float layer_length = float(layer_count - 1);

    highp float layer_origin_pos = float(layer_count - 1) * color.b;
    highp float layer_pos        = float(int(layer_origin_pos));

    highp float rr = color.r * edge_length;
    highp float gg = color.g * edge_length;

    highp vec2 pos_x = getSamplePos(rr);
    highp vec2 pos_y = getSamplePos(gg);
    highp vec2 pos_z = vec2(layer_pos, layer_pos + 1.0f);

    highp float lut_tex_size_y_inv = 1.0f / float(lut_tex_size.y);

    highp vec2 uv0 = calculateUV(pos_x.x, pos_y.x, pos_z.x, lut_tex_size_x_inv, lut_tex_size_y_inv, float(layer_count));
    highp vec2 uv1 = calculateUV(pos_x.x, pos_y.x, pos_z.y, lut_tex_size_x_inv, lut_tex_size_y_inv, float(layer_count));
    highp vec2 uv2 = calculateUV(pos_x.x, pos_y.y, pos_z.x, lut_tex_size_x_inv, lut_tex_size_y_inv, float(layer_count));
    highp vec2 uv3 = calculateUV(pos_x.x, pos_y.y, pos_z.y, lut_tex_size_x_inv, lut_tex_size_y_inv, float(layer_count));
    highp vec2 uv4 = calculateUV(pos_x.y, pos_y.x, pos_z.x, lut_tex_size_x_inv, lut_tex_size_y_inv, float(layer_count));
    highp vec2 uv5 = calculateUV(pos_x.y, pos_y.x, pos_z.y, lut_tex_size_x_inv, lut_tex_size_y_inv, float(layer_count));
    highp vec2 uv6 = calculateUV(pos_x.y, pos_y.y, pos_z.x, lut_tex_size_x_inv, lut_tex_size_y_inv, float(layer_count));
    highp vec2 uv7 = calculateUV(pos_x.y, pos_y.y, pos_z.y, lut_tex_size_x_inv, lut_tex_size_y_inv, float(layer_count));

    highp float alpha = (rr - pos_x.x) / (pos_x.y - pos_x.x);
    highp float beta  = (gg - pos_y.x) / (pos_y.y - pos_y.x);
    highp float gamma = (layer_origin_pos - pos_z.x) / (pos_z.y - pos_z.x);

    highp vec4 new_color_0 = texture(color_grading_lut_texture_sampler, uv0);
    highp vec4 new_color_1 = texture(color_grading_lut_texture_sampler, uv1);
    highp vec4 new_color_2 = texture(color_grading_lut_texture_sampler, uv2);
    highp vec4 new_color_3 = texture(color_grading_lut_texture_sampler, uv3);
    highp vec4 new_color_4 = texture(color_grading_lut_texture_sampler, uv4);
    highp vec4 new_color_5 = texture(color_grading_lut_texture_sampler, uv5);
    highp vec4 new_color_6 = texture(color_grading_lut_texture_sampler, uv6);
    highp vec4 new_color_7 = texture(color_grading_lut_texture_sampler, uv7);

    highp vec4 new_color_01 = new_color_0 * (1.0f - gamma) + new_color_1 * gamma;
    highp vec4 new_color_23 = new_color_2 * (1.0f - gamma) + new_color_3 * gamma;
    highp vec4 new_color_45 = new_color_4 * (1.0f - gamma) + new_color_5 * gamma;
    highp vec4 new_color_67 = new_color_6 * (1.0f - gamma) + new_color_7 * gamma;

    highp vec4 new_color_0123 = new_color_01 * (1.0f - beta) + new_color_23 * beta;
    highp vec4 new_color_4567 = new_color_45 * (1.0f - beta) + new_color_67 * beta;

    highp vec4 new_color = new_color_0123 * (1.0f - alpha) + new_color_4567 * alpha;

    out_color = new_color;
}
